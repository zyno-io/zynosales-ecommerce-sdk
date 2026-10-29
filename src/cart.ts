import type { ZynoSalesClient } from './client';
import { toPublicError, type PublicError, ZynoSalesError } from './errors';
import type { ZynoSalesStorage } from './storage';
import { SerialQueue } from './queue';
import { parseCartReference, type AccountCartReference, type CartReference, type GuestCartReference } from './references';
import type { Cart, CartItemInput, CartResponse, CartServerAccess, CartSnapshot } from './types';

type CartMutationListener = () => void;

/** Persistent, serialized cart state for one storefront instance. */
export class CartSession {
    private readonly listeners = new Set<(snapshot: CartSnapshot) => void>();
    private readonly client: ZynoSalesClient;
    private readonly storage: ZynoSalesStorage;
    private storageKey: string;
    private reference: CartReference | null = null;
    private cart: Cart | null = null;
    private busy = false;
    private lastError: PublicError | null = null;
    private readonly queue: SerialQueue;
    private mutationListener?: CartMutationListener;

    public constructor(options: { client: ZynoSalesClient; storage: ZynoSalesStorage; storageKey: string; queue?: SerialQueue }) {
        this.client = options.client;
        this.storage = options.storage;
        this.storageKey = options.storageKey;
        this.queue = options.queue ?? new SerialQueue();
        this.reference = this.readReference();
    }

    /** Returns the latest render-safe cart snapshot. */
    public getSnapshot(): CartSnapshot {
        return {
            cart: this.cart,
            hasCart: this.reference !== null,
            mode: this.reference?.mode ?? null,
            customerPolicy: this.reference?.mode === 'account'
                ? {
                    policyId: this.reference.scope.policyId,
                    policyRevision: this.reference.scope.policyRevision,
                    orderHistoryScope: this.reference.scope.orderHistoryScope
                }
                : null,
            isBusy: this.busy,
            lastError: this.lastError
        };
    }

    /** Subscribes to render-safe cart changes. Capability values are never included. */
    public subscribe(listener: (snapshot: CartSnapshot) => void): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    /** Restores the persisted cart, clearing it when its capability is stale. */
    public restore(): Promise<CartSnapshot> {
        return this.enqueue(() => this.restoreInternal());
    }

    /** Reads the cart from Sales without creating a new cart. */
    public refresh(): Promise<CartSnapshot> {
        return this.restore();
    }

    /** Replaces all cart line inputs. An empty list abandons the open cart. */
    public setItems(items: CartItemInput[]): Promise<CartSnapshot> {
        return this.enqueue(async () => this.replaceItems(items));
    }

    /** Adds a product to the cart, merging the same product/notes combination when possible. */
    public add(item: CartItemInput): Promise<CartSnapshot> {
        return this.enqueue(async () => {
            if (this.reference && !this.cart) await this.restoreInternal();
            const current = this.cart ? this.toItemInputs() : [];
            const existing = current.find(
                candidate => candidate.productId === item.productId && (candidate.notes ?? null) === (item.notes ?? null)
                    && (!item.membership || (candidate.membership?.pricingTierId ?? null) === (item.membership.pricingTierId ?? null))
            );
            if (existing) {
                if (existing.membership || item.membership) {
                    current[current.indexOf(existing)] = { ...existing, ...item, membership: item.membership ?? existing.membership };
                } else existing.qty += item.qty;
            } else {
                current.push({ ...item });
            }
            return this.replaceItems(current);
        });
    }

    /** Updates an existing server cart item's quantity. A zero quantity removes it. */
    public setQuantity(input: { cartItemId: string; qty: number }): Promise<CartSnapshot> {
        return this.enqueue(async () => {
            const items = this.toItemInputs(input.cartItemId, input.qty);
            return this.replaceItems(items);
        });
    }

    /** Removes an existing server cart item. */
    public remove(input: { cartItemId: string }): Promise<CartSnapshot> {
        return this.setQuantity({ cartItemId: input.cartItemId, qty: 0 });
    }

    /** Abandons the current cart and removes its local capability. */
    public abandon(): Promise<void> {
        return this.enqueue(async () => {
            if (!this.reference) return;
            const reference = this.reference;
            this.setBusy(true);

            try {
                await this.client.abandonCart(reference.cartId, reference.cartKey);
            } catch (error) {
                if (!isCapabilityLost(error)) {
                    this.setError(error);
                    throw error;
                }
            } finally {
                this.clearInternal();
                this.setBusy(false);
                this.notifyMutation();
            }
        });
    }

    /** Clears local cart state without issuing an API call. */
    public clear(): void {
        this.clearInternal();
    }

    /** Runs a same-origin server handoff with the current cart capability. */
    /**
     * Provides cart capability access for one trusted merchant-server call.
     * Treat the returned key as a secret and refresh the cart after server mutations.
     */
    public withServerAccess<T>(callback: (access: CartServerAccess) => Promise<T> | T): Promise<T> {
        const reference = this.requireReference();
        return Promise.resolve(callback({ cartId: reference.cartId, cartKey: reference.cartKey }));
    }

    /** @internal Accepts an authoritative cart response from another SDK layer. */
    public accept(response: CartResponse): void {
        const nextReference = referenceFromResponse(response, this.reference);
        this.reference = nextReference;
        this.persistReference(nextReference);
        this.cart = response.cart;
        this.lastError = null;
        this.emit();
    }

    /** @internal Returns current capabilities for generated Sales calls. */
    public requireReference(): CartReference {
        if (!this.reference) throw new ZynoSalesError('There is no active cart.');
        return this.reference;
    }

    /** @internal Changes the storage key once the storefront identity is known. */
    public setStorageKey(storageKey: string): void {
        if (this.storageKey === storageKey) return;

        const oldStorageKey = this.storageKey;
        const oldReference = this.reference;
        this.storageKey = storageKey;
        const scopedReference = this.readReference();
        if (scopedReference) {
            this.reference = scopedReference;
            if (oldReference?.cartId !== scopedReference.cartId) this.cart = null;
        } else if (this.reference) {
            this.persistReference(this.reference);
        }
        this.storage.removeItem(oldStorageKey);
        this.emit();

        if (oldReference && scopedReference && oldReference.cartId !== scopedReference.cartId) {
            this.notifyMutation();
        }
    }

    /** @internal Adds a callback invoked after authoritative cart mutations. */
    public setMutationListener(listener: CartMutationListener): void {
        this.mutationListener = listener;
    }

    /** @internal Runs another SDK layer inside cart mutation serialization. */
    public runExclusive<T>(operation: () => Promise<T>): Promise<T> {
        return this.queue.run(operation);
    }

    private async replaceItems(items: CartItemInput[]): Promise<CartSnapshot> {
        if (items.some(item => !item.productId || item.qty < 1 || !Number.isFinite(item.qty))) {
            throw new ZynoSalesError('Each cart item must have a productId and a quantity of at least one.');
        }

        if (items.length === 0) {
            await this.abandonInternal();
            return this.getSnapshot();
        }

        this.setBusy(true);
        try {
            const response = this.reference
                ? await this.client.replaceItems(this.reference.cartId, this.reference.cartKey, { items })
                : await this.client.createCart({ items });
            this.accept(response);
            this.notifyMutation();
            return this.getSnapshot();
        } catch (error) {
            if (isCapabilityLost(error)) this.clearInternal();
            else this.setError(error);
            throw error;
        } finally {
            this.setBusy(false);
        }
    }

    private async restoreInternal(): Promise<CartSnapshot> {
        if (!this.reference) return this.getSnapshot();
        this.setBusy(true);

        try {
            const response = await this.client.getCart(this.reference.cartId, this.reference.cartKey);
            this.accept(response);
            return this.getSnapshot();
        } catch (error) {
            if (isCapabilityLost(error)) {
                this.clearInternal();
                return this.getSnapshot();
            }
            this.setError(error);
            throw error;
        } finally {
            this.setBusy(false);
        }
    }

    private async abandonInternal(): Promise<void> {
        if (!this.reference) {
            this.clearInternal();
            return;
        }
        const reference = this.reference;
        this.setBusy(true);
        try {
            await this.client.abandonCart(reference.cartId, reference.cartKey);
        } catch (error) {
            if (!isCapabilityLost(error)) {
                this.setError(error);
                throw error;
            }
        } finally {
            this.clearInternal();
            this.setBusy(false);
            this.notifyMutation();
        }
    }

    private toItemInputs(targetId?: string, targetQuantity?: number): CartItemInput[] {
        if (!this.cart) throw new ZynoSalesError('Load the cart before changing an individual cart item.');

        return this.cart.items.flatMap(item => {
            const quantity = item.id === targetId ? targetQuantity : item.qty;
            if (!quantity || quantity < 1) return [];
            return [{ productId: item.product.id, qty: quantity, notes: item.notes,
                ...(item.membership ? { membership: { pricingTierId: item.membership.pricingTierId } } : {}) }];
        });
    }

    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
        return this.queue.run(operation);
    }

    private readReference(): CartReference | null {
        const raw = this.storage.getItem(this.storageKey);
        const reference = parseCartReference(raw);
        if (reference && raw !== JSON.stringify(reference)) this.persistReference(reference);
        return reference;
    }

    private persistReference(reference: CartReference): void {
        this.storage.setItem(this.storageKey, JSON.stringify(reference));
    }

    private clearInternal(): void {
        this.reference = null;
        this.cart = null;
        this.lastError = null;
        this.storage.removeItem(this.storageKey);
        this.emit();
    }

    private setBusy(busy: boolean): void {
        this.busy = busy;
        this.emit();
    }

    private setError(error: unknown): void {
        this.lastError = toPublicError(error);
        this.emit();
    }

    private notifyMutation(): void {
        this.mutationListener?.();
    }

    private emit(): void {
        const snapshot = this.getSnapshot();
        for (const listener of this.listeners) listener(snapshot);
    }
}

function referenceFromResponse(response: CartResponse, existing: CartReference | null): CartReference {
    const cartKey = response.cartKey ?? existing?.cartKey;
    if (!cartKey) throw new ZynoSalesError('Sales did not return the cart capability required to continue checkout.');

    const customer = response.cart.customer;
    if (customer.bound) {
        if (!customer.policyId || customer.policyRevision === null || !customer.orderHistoryScope) {
            throw new ZynoSalesError('Sales returned incomplete account checkout state.');
        }
        const accountReference: AccountCartReference = {
            version: 2,
            mode: 'account',
            cartId: response.cartId,
            cartKey,
            scope: {
                policyId: customer.policyId,
                policyRevision: customer.policyRevision,
                orderHistoryScope: customer.orderHistoryScope
            }
        };
        if (existing?.mode === 'account' && (
            existing.scope.policyId !== accountReference.scope.policyId
            || existing.scope.policyRevision !== accountReference.scope.policyRevision
            || existing.scope.orderHistoryScope !== accountReference.scope.orderHistoryScope
        )) {
            throw new ZynoSalesError('The account cart policy changed. Resume it with its original customer session.', {
                status: 409,
                code: 'AUTH_POLICY_MISMATCH'
            });
        }
        return accountReference;
    }

    if (existing?.mode === 'account') throw new ZynoSalesError('Sales no longer reports the saved account binding.');
    const orderKey = response.orderKey ?? (existing?.mode === 'guest' ? existing.orderKey : undefined);
    if (!orderKey) throw new ZynoSalesError('Sales did not return the order capability required to continue guest checkout.');
    const guestReference: GuestCartReference = { version: 1, mode: 'guest', cartId: response.cartId, cartKey, orderKey };
    return guestReference;
}

function isCapabilityLost(error: unknown): boolean {
    return error instanceof ZynoSalesError && error.isCapabilityLost;
}
