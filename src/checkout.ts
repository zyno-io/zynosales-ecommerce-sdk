import type { CartSession } from './cart';
import type { ZynoSalesClient } from './client';
import { toPublicError, type PublicError, ZynoSalesError } from './errors';
import type { ZynoSalesStorage } from './storage';
import { SerialQueue } from './queue';
import { parseCompletedOrderReference, type AccountCompletedOrderReference, type CompletedOrderReference, type CartReference } from './references';
import type {
    CardPaymentSetup,
    MembershipCardSetup,
    CardCheckoutSetup,
    Cart,
    CheckoutSnapshot,
    Order,
    ZynoSalesHooks
} from './types';
import type {
    ISalesEcommAddressVerificationInput,
    ISalesEcommBuyerInput,
    ISalesEcommCartDiscountCodeInput,
    ISalesEcommCartFulfillmentInput,
    ISalesEcommCartShippingRatesInput,
    ISalesEcommShippingSelectionQuoteInput
} from './generated/sales';

type PendingPayment = {
    cartId: string;
    idempotencyKey: string;
    paymentAttemptId?: string;
    paymentIntentId?: string;
    setupIntentId?: string;
    kind?: 'payment' | 'setup';
};

type OrphanAccountPayment = {
    version: 1;
    reference: AccountCompletedOrderReference;
    pending: PendingPayment;
};

type OrphanAccountPayments = { version: 1; items: OrphanAccountPayment[] };

const MAX_ORPHAN_ACCOUNT_PAYMENTS = 8;

/** Coordinates framework-agnostic checkout transitions for the active cart. */
export class CheckoutCoordinator {
    private readonly cartSession: CartSession;
    private readonly client: ZynoSalesClient;
    private readonly storage: ZynoSalesStorage;
    private pendingPaymentKey: string;
    private readonly hooks: ZynoSalesHooks;
    private readonly listeners = new Set<(snapshot: CheckoutSnapshot) => void>();
    private completedOrderReference: CompletedOrderReference | null;
    private order: Order | null = null;
    private paymentAttemptId: string | null = null;
    private paymentAttemptStatus: string | null = null;
    private busy = false;
    private lastError: PublicError | null = null;
    private readonly queue: SerialQueue;

    public constructor(options: {
        cartSession: CartSession;
        client: ZynoSalesClient;
        storage: ZynoSalesStorage;
        pendingPaymentKey: string;
        hooks: ZynoSalesHooks;
        queue?: SerialQueue;
    }) {
        this.cartSession = options.cartSession;
        this.client = options.client;
        this.storage = options.storage;
        this.pendingPaymentKey = options.pendingPaymentKey;
        this.hooks = options.hooks;
        this.queue = options.queue ?? new SerialQueue();
        this.completedOrderReference = this.readCompletedOrder();
    }

    /** Returns the latest render-safe checkout snapshot. */
    public getSnapshot(): CheckoutSnapshot {
        return {
            order: this.order,
            paymentAttemptId: this.paymentAttemptId,
            paymentAttemptStatus: this.paymentAttemptStatus,
            isBusy: this.busy,
            lastError: this.lastError
        };
    }

    /** @internal Runs another SDK layer inside checkout/payment recovery serialization. */
    public runExclusive<T>(operation: () => Promise<T>): Promise<T> {
        return this.queue.run(operation);
    }

    /** Subscribes to render-safe checkout changes. */
    public subscribe(listener: (snapshot: CheckoutSnapshot) => void): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    /**
     * Updates the purchaser’s CRM identity on the active cart. Send original typed values here;
     * fulfillment data can be carrier-normalized before an order closes.
     */
    public setBuyer(input: ISalesEcommBuyerInput): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.updateBuyer(reference.cartId, reference.cartKey, input);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /** Verifies an address without silently choosing a normalization candidate. */
    public verifyAddress(input: ISalesEcommAddressVerificationInput) {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            return this.client.verifyAddress(reference.cartId, reference.cartKey, input);
        });
    }

    /** Requests backend-authoritative shipping rates. */
    public getShippingRates(input: ISalesEcommCartShippingRatesInput) {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            return this.client.calculateShippingRates(reference.cartId, reference.cartKey, input);
        });
    }

    /** Quotes a complete package-rate selection with backend-authoritative pricing. */
    public quoteShippingSelection(input: ISalesEcommShippingSelectionQuoteInput) {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            return this.client.quoteShippingSelection(reference.cartId, reference.cartKey, input);
        });
    }

    /** Applies fulfillment details and selected shipping rates to the active cart. Use `crmAddressId` to reuse a selected CRM address. */
    public setFulfillment(input: ISalesEcommCartFulfillmentInput): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.updateFulfillment(reference.cartId, reference.cartKey, input);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /** Removes fulfillment from the active cart. */
    public removeFulfillment(): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.removeFulfillment(reference.cartId, reference.cartKey);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /** Validates a discount code without changing the cart. */
    public validateDiscount(code: string) {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            return this.client.validateDiscount(reference.cartId, reference.cartKey, code);
        });
    }

    /** Applies a discount code and returns the authoritative cart. */
    public applyDiscount(input: ISalesEcommCartDiscountCodeInput): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.applyDiscount(reference.cartId, reference.cartKey, input);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /** Removes the active discount and returns the authoritative cart. */
    public removeDiscount(): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.removeDiscount(reference.cartId, reference.cartKey);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /** Records the shopper's explicit acceptance of the current server-provided membership terms hash. */
    public acceptMembershipTerms(input: { termsHash: string }): Promise<Cart> {
        return this.runCartMutation(async () => {
            const reference = this.cartSession.requireReference();
            const response = await this.client.acceptMembershipTerms(reference.cartId, reference.cartKey, input);
            this.cartSession.accept(response);
            return response.cart;
        });
    }

    /**
     * Runs the final policy hook and opens a card-payment attempt.
     * For a zero-due recurring cart it returns a SetupIntent; other zero-due carts finalize and return `null`.
     */
    public beginCardPayment(): Promise<CardCheckoutSetup | null> {
        return this.run(async () => {
            if (this.cartSession.getSnapshot().hasCart) {
                await this.recoverPaymentInternal(false);
            }
            if (this.order) return null;

            let reference = this.cartSession.requireReference();
            let pending = this.readPending();
            if (pending?.cartId !== reference.cartId) {
                if (pending && !this.readOrphanAccountPayments().some(orphan => orphan.pending.cartId === pending?.cartId)) {
                    throw new ZynoSalesError('Recover the earlier payment outcome before replacing its recovery marker.');
                }
                this.clearPending();
                pending = null;
            }

            if (!pending) {
                const before = this.hooks.beforePayment;
                if (before) {
                    const cart = this.requireCart();
                    await this.cartSession.withServerAccess(access => before({ cart, cartAccess: access }));
                    await this.cartSession.refresh();
                }

                reference = this.cartSession.requireReference();
                const cart = this.requireCart();
                if (cart.priceDue === 0 && !cart.membershipRequirements?.paymentMethodSetupRequired) {
                    await this.finalizeZeroDueCartInternal(reference);
                    return null;
                }
            }

            const idempotencyKey = pending?.idempotencyKey ?? createIdempotencyKey();
            const kind = pending?.kind ?? (this.requireCart().membershipRequirements?.paymentMethodSetupRequired ? 'setup' : 'payment');
            this.writePending({
                cartId: reference.cartId,
                idempotencyKey, kind,
                ...(pending?.setupIntentId ? { setupIntentId: pending.setupIntentId } : {}),
                ...(pending?.paymentAttemptId ? { paymentAttemptId: pending.paymentAttemptId } : {}),
                ...(pending?.paymentIntentId ? { paymentIntentId: pending.paymentIntentId } : {})
            });
            const setup = kind === 'setup'
                ? await this.client.setupMembershipCard(reference.cartId, reference.cartKey, { idempotencyKey })
                : await this.client.setupCardPayment(reference.cartId, reference.cartKey, { idempotencyKey });
            this.cartSession.accept(setup);
            this.paymentAttemptId = setup.paymentAttemptId;
            this.paymentAttemptStatus = 'creating';
            this.writePending({
                cartId: setup.cartId,
                idempotencyKey,
                paymentAttemptId: setup.paymentAttemptId,
                kind,
                ...('setupIntentId' in setup ? { setupIntentId: setup.setupIntentId } : { paymentIntentId: setup.paymentIntentId })
            });
            this.emit();
            return setup;
        });
    }

    /** Records an authorized Stripe PaymentIntent with Sales. */
    public completeCardPayment(input: Pick<CardPaymentSetup, 'paymentAttemptId' | 'paymentIntentId'>): Promise<Order> {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            const order = await this.client.confirmCardPayment(reference.cartId, reference.cartKey, input);
            await this.finish(order, completedReference(reference, order.id));
            return order;
        });
    }

    /** Completes a zero-due membership purchase after Stripe confirms its SetupIntent. */
    public completeMembershipCardSetup(input: Pick<MembershipCardSetup, 'paymentAttemptId' | 'setupIntentId'>): Promise<Order> {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            const order = await this.client.confirmMembershipCard(reference.cartId, reference.cartKey, input);
            await this.finish(order, completedReference(reference, order.id));
            return order;
        });
    }

    /** Reads one payment attempt for host-managed payment UI/recovery. */
    public getPaymentAttempt(attemptId: string) {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            const attempt = await this.client.getPaymentAttempt(reference.cartId, reference.cartKey, attemptId);
            this.paymentAttemptId = attempt.id;
            this.paymentAttemptStatus = attempt.status;
            this.emit();
            return attempt;
        });
    }

    /** Cancels an unneeded payment attempt. */
    public cancelPaymentAttempt(attemptId: string): Promise<void> {
        return this.run(async () => {
            const reference = this.cartSession.requireReference();
            await this.client.cancelPaymentAttempt(reference.cartId, reference.cartKey, attemptId);
            this.clearPending();
            this.paymentAttemptId = null;
            this.paymentAttemptStatus = 'canceled';
            this.emit();
        });
    }

    /** Recovers a paid order or a previously authorized payment attempt after a reload. */
    public recoverPayment(): Promise<Order | null> {
        return this.run(() => this.recoverPaymentInternal(true));
    }

    /** Reads the completed order using the retained order capability. */
    public getOrder(): Promise<Order> {
        return this.run(async () => {
            const activeReference = this.cartSession.getSnapshot().hasCart
                ? this.cartSession.requireReference()
                : null;
            const reference = activeReference
                ? completedReference(activeReference, activeReference.cartId)
                : this.completedOrderReference;
            if (!reference) throw new ZynoSalesError('There is no completed order.');

            const order = await this.getOrderForReference(reference);
            if (order.status === 'paid') await this.finish(order, reference);
            return order;
        });
    }

    /** @internal Clears local payment recovery state after any authoritative cart mutation. */
    public invalidatePayment(): void {
        this.clearPending();
        this.clearCompletedOrder();
        this.order = null;
        this.paymentAttemptId = null;
        this.paymentAttemptStatus = null;
        this.emit();
    }

    /** @internal Detaches an account cart on logout while retaining its pending payment outcome reference. */
    public detachAccountCartForLogout(): void {
        const snapshot = this.cartSession.getSnapshot();
        if (!snapshot.hasCart || snapshot.mode !== 'account') return;

        const reference = this.cartSession.requireReference();
        if (reference.mode !== 'account') return;
        let pending: PendingPayment | null = null;
        try {
            pending = this.readPending();
            const orphanSaved = pending ? this.saveOrphanAccountPayment(pending, reference) : false;
            this.clearCompletedOrder();
            if (pending) {
                this.completedOrderReference = {
                    version: 2,
                    mode: 'account',
                    cartId: pending.cartId,
                    orderId: pending.cartId,
                    scope: reference.scope
                };
                this.writeCompletedOrder(this.completedOrderReference);
                if (orphanSaved) this.clearPending();
            } else {
                this.order = null;
                this.paymentAttemptId = null;
                this.paymentAttemptStatus = null;
            }
        } catch {
            // Logout must still detach the in-memory cart when browser storage is unavailable.
            this.completedOrderReference = pending
                ? completedReference(reference, pending.cartId)
                : null;
            this.order = null;
            this.paymentAttemptId = null;
            this.paymentAttemptStatus = null;
        } finally {
            try {
                this.cartSession.clear();
            } catch {
                // CartSession clears its in-memory capability before attempting storage cleanup.
            }
            this.emit();
        }
    }

    /** @internal Changes the payment storage key once the storefront identity is known. */
    public setStorageKey(pendingPaymentKey: string): void {
        if (this.pendingPaymentKey === pendingPaymentKey) return;

        const oldPendingPaymentKey = this.pendingPaymentKey;
        const oldPending = this.readPending(oldPendingPaymentKey);
        const oldCompleted = this.readCompletedOrder(oldPendingPaymentKey);
        const oldOrphans = this.readOrphanAccountPayments(oldPendingPaymentKey);
        const scopedOrphans = this.readOrphanAccountPayments(pendingPaymentKey);
        this.pendingPaymentKey = pendingPaymentKey;

        const scopedPending = this.readPending();
        if (!scopedPending && oldPending) this.writePending(oldPending);
        if (!scopedOrphans.length && oldOrphans.length) this.writeOrphanAccountPayments(oldOrphans, pendingPaymentKey);

        const previousCompleted = this.completedOrderReference;
        const scopedCompleted = this.readCompletedOrder();
        this.completedOrderReference = scopedCompleted ?? oldCompleted;
        if (!scopedCompleted && oldCompleted) this.writeCompletedOrder(oldCompleted);
        if (this.order && previousCompleted?.orderId !== this.completedOrderReference?.orderId) this.order = null;

        this.storage.removeItem(oldPendingPaymentKey);
        this.storage.removeItem(completedOrderStorageKey(oldPendingPaymentKey));
        if (!scopedOrphans.length && oldOrphans.length) this.storage.removeItem(orphanAccountPaymentKey(oldPendingPaymentKey));
        this.emit();
    }

    private async finalizeZeroDueCartInternal(reference: CartReference): Promise<void> {
        const result = await this.client.finalizeZeroDueCart(reference.cartId, reference.cartKey);
        this.cartSession.accept(result);
        const finalReference = this.cartSession.requireReference();
        const order = finalReference.mode === 'guest'
            ? await this.client.getOrder(finalReference.cartId, finalReference.orderKey)
            : await this.client.getCustomerOrder(finalReference.cartId);
        await this.finish(order, completedReference(finalReference, order.id));
    }

    private async recoverPaymentInternal(allowOrphanRecovery: boolean): Promise<Order | null> {
        const activeCartId = this.cartSession.getSnapshot().hasCart ? this.cartSession.requireReference().cartId : null;
        const orphan = allowOrphanRecovery
            ? this.readOrphanAccountPayments().find(entry => entry.pending.cartId !== activeCartId)
            : undefined;
        if (orphan) {
            const order = await this.getOrderForReference(orphan.reference);
            if (order.status === 'paid') await this.finish(order, orphan.reference);
            return order;
        }

        if (!this.cartSession.getSnapshot().hasCart) {
            const completed = this.completedOrderReference;
            if (!completed) throw new ZynoSalesError('There is no active cart.');
            const order = await this.getOrderForReference(completed);
            if (order.status === 'paid') {
                await this.finish(order, completed);
                return order;
            }
            return null;
        }

        const reference = this.cartSession.requireReference();
        try {
            const order = reference.mode === 'guest'
                ? await this.client.getOrder(reference.cartId, reference.orderKey)
                : await this.client.getCustomerOrder(reference.cartId);
            if (order.status === 'paid') {
                await this.finish(order, completedReference(reference, order.id));
                return order;
            }
        } catch (error) {
            if (!(error instanceof ZynoSalesError) || !error.isCapabilityLost) throw error;
        }

        const pending = this.readPendingForCart(reference.cartId);
        if (!pending || pending.cartId !== reference.cartId || !pending.paymentAttemptId || (!pending.paymentIntentId && !pending.setupIntentId)) return null;

        const attempt = await this.client.getPaymentAttempt(reference.cartId, reference.cartKey, pending.paymentAttemptId);
        this.paymentAttemptId = attempt.id;
        this.paymentAttemptStatus = attempt.status;
        this.emit();

        if (attempt.status === 'authorized' || attempt.status === 'recorded') {
            const order = pending.setupIntentId
                ? await this.client.confirmMembershipCard(reference.cartId, reference.cartKey, { paymentAttemptId: pending.paymentAttemptId, setupIntentId: pending.setupIntentId })
                : await this.client.confirmCardPayment(reference.cartId, reference.cartKey, { paymentAttemptId: pending.paymentAttemptId, paymentIntentId: pending.paymentIntentId! });
            await this.finish(order, completedReference(reference, order.id));
            return order;
        }

        if (attempt.status === 'canceled' || attempt.status === 'failed') this.clearPending();
        return null;
    }

    private async finish(order: Order, reference: CompletedOrderReference): Promise<void> {
        const completionRecorded = this.completedOrderReference?.orderId === order.id;
        this.completedOrderReference = { ...reference, orderId: order.id };
        this.writeCompletedOrder(this.completedOrderReference);
        this.order = order;
        this.paymentAttemptId = null;
        this.paymentAttemptStatus = null;
        this.clearPendingForCart(reference.cartId);
        if (this.cartSession.getSnapshot().hasCart && this.cartSession.requireReference().cartId === reference.cartId) {
            this.cartSession.clear();
        }
        this.emit();

        const after = this.hooks.afterOrderCompleted;
        if (!after || completionRecorded) return;
        try {
            await after({ order, cartId: reference.cartId });
        } catch {
            // The order is complete. Merchant follow-up must not turn it into a checkout failure.
        }
    }

    private getOrderForReference(reference: CompletedOrderReference): Promise<Order> {
        return reference.mode === 'guest'
            ? this.client.getOrder(reference.orderId, reference.orderKey)
            : this.client.getCustomerOrder(reference.orderId);
    }

    private requireCart(): Cart {
        const cart = this.cartSession.getSnapshot().cart;
        if (!cart) throw new ZynoSalesError('There is no loaded cart.');
        return cart;
    }

    private runCartMutation<T>(operation: () => Promise<T>): Promise<T> {
        return this.run(async () => {
            const result = await operation();
            this.invalidatePayment();
            return result;
        });
    }

    private run<T>(operation: () => Promise<T>): Promise<T> {
        return this.queue.run(async () => {
            this.busy = true;
            this.emit();
            try {
                this.lastError = null;
                return await operation();
            } catch (error) {
                this.lastError = toPublicError(error);
                this.emit();
                throw error;
            } finally {
                this.busy = false;
                this.emit();
            }
        });
    }

    private readPending(storageKey: string = this.pendingPaymentKey): PendingPayment | null {
        const raw = this.storage.getItem(storageKey);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as Partial<PendingPayment>;
            if (typeof parsed.cartId !== 'string' || typeof parsed.idempotencyKey !== 'string') return null;
            return {
                cartId: parsed.cartId,
                idempotencyKey: parsed.idempotencyKey,
                ...(typeof parsed.paymentAttemptId === 'string' ? { paymentAttemptId: parsed.paymentAttemptId } : {}),
                ...(typeof parsed.paymentIntentId === 'string' ? { paymentIntentId: parsed.paymentIntentId } : {}),
                ...(typeof parsed.setupIntentId === 'string' ? { setupIntentId: parsed.setupIntentId } : {}),
                ...(parsed.kind === 'setup' || parsed.kind === 'payment' ? { kind: parsed.kind } : {})
            };
        } catch {
            return null;
        }
    }

    private writePending(pending: PendingPayment): void {
        this.storage.setItem(this.pendingPaymentKey, JSON.stringify(pending));
    }

    private clearPending(): void {
        this.storage.removeItem(this.pendingPaymentKey);
    }

    private readPendingForCart(cartId: string): PendingPayment | null {
        const active = this.readPending();
        if (active?.cartId === cartId) return active;
        const orphan = this.readOrphanAccountPayments().find(entry => entry.pending.cartId === cartId);
        return orphan?.pending ?? null;
    }

    private clearPendingForCart(cartId: string): void {
        if (this.readPending()?.cartId === cartId) this.clearPending();
        const orphans = this.readOrphanAccountPayments();
        const remaining = orphans.filter(orphan => orphan.pending.cartId !== cartId);
        if (remaining.length !== orphans.length) this.writeOrphanAccountPayments(remaining);
    }

    private saveOrphanAccountPayment(pending: PendingPayment, reference: Extract<CartReference, { mode: 'account' }>): boolean {
        const orphans = this.readOrphanAccountPayments();
        const existing = orphans.find(orphan => orphan.pending.cartId === pending.cartId);
        const next: OrphanAccountPayment = {
            version: 1,
            reference: completedReference(reference, pending.cartId) as AccountCompletedOrderReference,
            pending
        };
        if (existing) {
            this.writeOrphanAccountPayments(orphans.map(orphan => orphan.pending.cartId === pending.cartId ? next : orphan));
            return true;
        } else if (orphans.length < MAX_ORPHAN_ACCOUNT_PAYMENTS) {
            this.writeOrphanAccountPayments([...orphans, next]);
            return true;
        }
        return false;
    }

    private readOrphanAccountPayments(storageKey: string = this.pendingPaymentKey): OrphanAccountPayment[] {
        const raw = this.storage.getItem(orphanAccountPaymentKey(storageKey));
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as Partial<OrphanAccountPayments> | Partial<OrphanAccountPayment>;
            const candidates = Array.isArray((parsed as Partial<OrphanAccountPayments>).items)
                ? (parsed as Partial<OrphanAccountPayments>).items!
                : [parsed as Partial<OrphanAccountPayment>];
            if (parsed.version !== 1) return [];
            return candidates.slice(0, MAX_ORPHAN_ACCOUNT_PAYMENTS).flatMap(candidate => {
                const reference = parseCompletedOrderReference(JSON.stringify(candidate.reference));
                const pending = candidate.pending;
                if (
                    !reference || reference.mode !== 'account' ||
                    !pending || typeof pending.cartId !== 'string' ||
                    typeof pending.idempotencyKey !== 'string' || pending.cartId !== reference.cartId
                ) return [];
                return [{ version: 1, reference, pending: { ...pending } }];
            });
        } catch {
            return [];
        }
    }

    private writeOrphanAccountPayments(orphans: OrphanAccountPayment[], storageKey: string = this.pendingPaymentKey): void {
        if (!orphans.length) this.storage.removeItem(orphanAccountPaymentKey(storageKey));
        else this.storage.setItem(orphanAccountPaymentKey(storageKey), JSON.stringify({ version: 1, items: orphans.slice(0, MAX_ORPHAN_ACCOUNT_PAYMENTS) } satisfies OrphanAccountPayments));
    }

    private readCompletedOrder(pendingPaymentKey: string = this.pendingPaymentKey): CompletedOrderReference | null {
        const raw = this.storage.getItem(completedOrderStorageKey(pendingPaymentKey));
        const reference = parseCompletedOrderReference(raw);
        if (reference && raw !== JSON.stringify(reference)) {
            this.storage.setItem(completedOrderStorageKey(pendingPaymentKey), JSON.stringify(reference));
        }
        return reference;
    }

    private writeCompletedOrder(reference: CompletedOrderReference): void {
        this.storage.setItem(completedOrderStorageKey(this.pendingPaymentKey), JSON.stringify(reference));
    }

    private clearCompletedOrder(): void {
        this.completedOrderReference = null;
        this.storage.removeItem(completedOrderStorageKey(this.pendingPaymentKey));
    }

    private emit(): void {
        const snapshot = this.getSnapshot();
        for (const listener of this.listeners) listener(snapshot);
    }
}

function createIdempotencyKey(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    throw new ZynoSalesError('The current runtime does not support crypto.randomUUID().');
}

function completedOrderStorageKey(pendingPaymentKey: string): string {
    return `${pendingPaymentKey}:completed`;
}

function orphanAccountPaymentKey(pendingPaymentKey: string): string {
    return `${pendingPaymentKey}:orphan-account`;
}

function completedReference(reference: CartReference, orderId: string): CompletedOrderReference {
    if (reference.mode === 'guest') {
        return { version: 1, mode: 'guest', cartId: reference.cartId, orderId, orderKey: reference.orderKey };
    }
    return { version: 2, mode: 'account', cartId: reference.cartId, orderId, scope: reference.scope };
}
