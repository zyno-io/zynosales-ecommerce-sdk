import type { CartSession } from './cart';
import type { ZynoSalesClient } from './client';
import { toPublicError, type PublicError, ZynoSalesError } from './errors';
import type { ZynoSalesStorage } from './storage';
import type {
    CardPaymentSetup,
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
};

type CompletedOrderReference = {
    cartId: string;
    orderId: string;
    orderKey: string;
};

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
    private queue: Promise<void> = Promise.resolve();

    public constructor(options: {
        cartSession: CartSession;
        client: ZynoSalesClient;
        storage: ZynoSalesStorage;
        pendingPaymentKey: string;
        hooks: ZynoSalesHooks;
    }) {
        this.cartSession = options.cartSession;
        this.client = options.client;
        this.storage = options.storage;
        this.pendingPaymentKey = options.pendingPaymentKey;
        this.hooks = options.hooks;
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

    /** Subscribes to render-safe checkout changes. */
    public subscribe(listener: (snapshot: CheckoutSnapshot) => void): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    /** Updates buyer identity on the active cart. */
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

    /** Applies fulfillment details and selected shipping rates to the active cart. */
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

    /**
     * Runs the final policy hook and opens a card-payment attempt.
     * For a zero-due cart it finalizes the order and returns `null`.
     */
    public beginCardPayment(): Promise<CardPaymentSetup | null> {
        return this.run(async () => {
            await this.recoverPaymentInternal();
            if (this.order) return null;

            let reference = this.cartSession.requireReference();
            let pending = this.readPending();
            if (pending?.cartId !== reference.cartId) {
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
                if (cart.priceDue === 0) {
                    await this.finalizeZeroDueCartInternal(reference.cartId, reference.cartKey, reference.orderKey);
                    return null;
                }
            }

            const idempotencyKey = pending?.idempotencyKey ?? createIdempotencyKey();
            this.writePending({
                cartId: reference.cartId,
                idempotencyKey,
                ...(pending?.paymentAttemptId ? { paymentAttemptId: pending.paymentAttemptId } : {}),
                ...(pending?.paymentIntentId ? { paymentIntentId: pending.paymentIntentId } : {})
            });
            const setup = await this.client.setupCardPayment(reference.cartId, reference.cartKey, { idempotencyKey });
            this.cartSession.accept(setup);
            this.paymentAttemptId = setup.paymentAttemptId;
            this.paymentAttemptStatus = 'creating';
            this.writePending({
                cartId: setup.cartId,
                idempotencyKey,
                paymentAttemptId: setup.paymentAttemptId,
                paymentIntentId: setup.paymentIntentId
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
            await this.finish(order, { cartId: reference.cartId, orderId: order.id, orderKey: reference.orderKey });
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
        return this.run(() => this.recoverPaymentInternal());
    }

    /** Reads the completed order using the retained order capability. */
    public getOrder(): Promise<Order> {
        return this.run(async () => {
            const activeReference = this.cartSession.getSnapshot().hasCart
                ? this.cartSession.requireReference()
                : null;
            const reference = activeReference
                ? { cartId: activeReference.cartId, orderId: activeReference.cartId, orderKey: activeReference.orderKey }
                : this.completedOrderReference;
            if (!reference) throw new ZynoSalesError('There is no completed order.');

            const order = await this.client.getOrder(reference.orderId, reference.orderKey);
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

    /** @internal Changes the payment storage key once the storefront identity is known. */
    public setStorageKey(pendingPaymentKey: string): void {
        if (this.pendingPaymentKey === pendingPaymentKey) return;

        const oldPendingPaymentKey = this.pendingPaymentKey;
        const oldPending = this.readPending(oldPendingPaymentKey);
        const oldCompleted = this.readCompletedOrder(oldPendingPaymentKey);
        this.pendingPaymentKey = pendingPaymentKey;

        const scopedPending = this.readPending();
        if (!scopedPending && oldPending) this.writePending(oldPending);

        const previousCompleted = this.completedOrderReference;
        const scopedCompleted = this.readCompletedOrder();
        this.completedOrderReference = scopedCompleted ?? oldCompleted;
        if (!scopedCompleted && oldCompleted) this.writeCompletedOrder(oldCompleted);
        if (this.order && previousCompleted?.orderId !== this.completedOrderReference?.orderId) this.order = null;

        this.storage.removeItem(oldPendingPaymentKey);
        this.storage.removeItem(completedOrderStorageKey(oldPendingPaymentKey));
        this.emit();
    }

    private async finalizeZeroDueCartInternal(cartId: string, cartKey: string, orderKey: string): Promise<void> {
        const result = await this.client.finalizeZeroDueCart(cartId, cartKey);
        this.cartSession.accept(result);
        const order = await this.client.getOrder(cartId, orderKey);
        await this.finish(order, { cartId, orderId: order.id, orderKey });
    }

    private async recoverPaymentInternal(): Promise<Order | null> {
        if (!this.cartSession.getSnapshot().hasCart) {
            const completed = this.completedOrderReference;
            if (!completed) throw new ZynoSalesError('There is no active cart.');
            const order = await this.client.getOrder(completed.orderId, completed.orderKey);
            if (order.status === 'paid') {
                await this.finish(order, completed);
                return order;
            }
            return null;
        }

        const reference = this.cartSession.requireReference();
        try {
            const order = await this.client.getOrder(reference.cartId, reference.orderKey);
            if (order.status === 'paid') {
                await this.finish(order, { cartId: reference.cartId, orderId: order.id, orderKey: reference.orderKey });
                return order;
            }
        } catch (error) {
            if (!(error instanceof ZynoSalesError) || !error.isCapabilityLost) throw error;
        }

        const pending = this.readPending();
        if (!pending || pending.cartId !== reference.cartId || !pending.paymentAttemptId || !pending.paymentIntentId) return null;

        const attempt = await this.client.getPaymentAttempt(reference.cartId, reference.cartKey, pending.paymentAttemptId);
        this.paymentAttemptId = attempt.id;
        this.paymentAttemptStatus = attempt.status;
        this.emit();

        if (attempt.status === 'authorized' || attempt.status === 'recorded') {
            const order = await this.client.confirmCardPayment(reference.cartId, reference.cartKey, {
                paymentAttemptId: pending.paymentAttemptId,
                paymentIntentId: pending.paymentIntentId
            });
            await this.finish(order, { cartId: reference.cartId, orderId: order.id, orderKey: reference.orderKey });
            return order;
        }

        if (attempt.status === 'canceled' || attempt.status === 'failed') this.clearPending();
        return null;
    }

    private async finish(order: Order, reference: Pick<CompletedOrderReference, 'cartId' | 'orderId' | 'orderKey'>): Promise<void> {
        const completionRecorded = this.completedOrderReference?.orderId === order.id;
        this.completedOrderReference = { ...reference, orderId: order.id };
        this.writeCompletedOrder(this.completedOrderReference);
        this.order = order;
        this.paymentAttemptId = null;
        this.paymentAttemptStatus = null;
        this.clearPending();
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
        const run = this.queue.then(async () => {
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
        this.queue = run.then(
            () => undefined,
            () => undefined
        );
        return run;
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
                ...(typeof parsed.paymentIntentId === 'string' ? { paymentIntentId: parsed.paymentIntentId } : {})
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

    private readCompletedOrder(pendingPaymentKey: string = this.pendingPaymentKey): CompletedOrderReference | null {
        const raw = this.storage.getItem(completedOrderStorageKey(pendingPaymentKey));
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as Partial<CompletedOrderReference>;
            if (
                typeof parsed.cartId !== 'string'
                || typeof parsed.orderId !== 'string'
                || typeof parsed.orderKey !== 'string'
            ) return null;
            return {
                cartId: parsed.cartId,
                orderId: parsed.orderId,
                orderKey: parsed.orderKey
            };
        } catch {
            return null;
        }
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
