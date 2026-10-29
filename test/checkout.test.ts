import { describe, expect, it, vi } from 'vitest';

import { CartSession } from '../src/cart';
import { CheckoutCoordinator } from '../src/checkout';
import type { ZynoSalesClient } from '../src/client';
import { ZynoSalesError } from '../src/errors';
import type { ZynoSalesStorage } from '../src/storage';
import type { CardPaymentSetup, CartResponse, Order } from '../src/types';

class TestStorage implements ZynoSalesStorage {
    public readonly values = new Map<string, string>();

    public getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    public setItem(key: string, value: string): void {
        this.values.set(key, value);
    }

    public removeItem(key: string): void {
        this.values.delete(key);
    }
}

function cartResponse(cartId = 'cart-1', priceDue = 1000): CartResponse {
    return {
        cartId,
        cartKey: `${cartId}-secret`,
        orderKey: `${cartId}-order-secret`,
        cart: {
            id: cartId,
            saleNumber: 'S-1',
            buyerContactPinned: false,
            customer: { bound: false, policyId: null, policyRevision: null, orderHistoryScope: null },
            status: 'open',
            items: [{
                id: `${cartId}-line-1`,
                qty: 1,
                effectivePrice: priceDue,
                notes: null,
                priceBase: priceDue,
                priceTax: 0,
                priceTotal: priceDue,
                product: { id: 'product-1', type: 'standard', name: 'Product', price: priceDue }
            }],
            priceDiscounted: priceDue,
            priceBase: priceDue,
            priceTax: 0,
            priceTotal: priceDue,
            priceDue,
            taxes: [],
            taxStatus: 'ok',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            closedAt: null
        }
    };
}

function paymentSetup(response: CartResponse): CardPaymentSetup {
    return {
        ...response,
        paymentAttemptId: `${response.cartId}-attempt`,
        paymentIntentId: `${response.cartId}-intent`,
        clientSecret: `${response.cartId}-client-secret`,
        amount: response.cart.priceDue
    };
}

function paidOrder(id = 'cart-1'): Order {
    return {
        id,
        saleNumber: 'S-1',
        status: 'paid',
        buyer: null,
        items: [],
        priceDiscounted: 1000,
        priceBase: 1000,
        priceTax: 0,
        priceTotal: 1000,
        pricePaid: 1000,
        priceDue: 0,
        taxes: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        closedAt: '2026-01-01T00:01:00.000Z'
    };
}

function checkoutFixture(client: ZynoSalesClient, storage = new TestStorage(), pendingPaymentKey = 'payment') {
    const cartStorage = new TestStorage();
    const cart = new CartSession({ client, storage: cartStorage, storageKey: 'cart' });
    const checkout = new CheckoutCoordinator({
        cartSession: cart,
        client,
        storage,
        pendingPaymentKey,
        hooks: {}
    });
    cart.setMutationListener(() => checkout.invalidatePayment());
    return { cart, checkout, storage };
}

describe('CheckoutCoordinator', () => {
    it('forwards typed buyer company to the active cart', async () => {
        const response = cartResponse();
        const updateBuyer = vi.fn(async () => response);
        const client = { updateBuyer } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client);
        cart.accept(response);
        const buyer = { name: 'Ada Lovelace', company: 'Analytical Engines', email: 'ada@example.com', phone: '+12125550100' };

        const updatedCart = await checkout.setBuyer(buyer);

        expect(updatedCart).toEqual(response.cart);
        expect(updateBuyer).toHaveBeenCalledWith('cart-1', 'cart-1-secret', buyer);
    });

    it('forwards a selected CRM address when applying fulfillment', async () => {
        const response = cartResponse();
        const updateFulfillment = vi.fn(async () => response);
        const client = { updateFulfillment } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client);
        cart.accept(response);
        const fulfillment = {
            crmAddressId: '4fa20852-80d1-4dd9-b8fd-51d17d478ed5',
            recipient: {
                name: 'Ada Lovelace',
                phone: '+12125550100',
                street1: '185 Surrey Park Drive',
                city: 'Fayetteville',
                state: 'GA',
                zip: '30215',
                country: 'US'
            }
        };

        const updatedCart = await checkout.setFulfillment(fulfillment);

        expect(updatedCart).toEqual(response.cart);
        expect(updateFulfillment).toHaveBeenCalledWith('cart-1', 'cart-1-secret', fulfillment);
    });

    it('refreshes a server-pinned buyer after the payment handoff before creating payment', async () => {
        const response = cartResponse();
        let serverCart = response;
        const getOrder = vi.fn(async () => {
            throw new ZynoSalesError('Order is not ready.', { status: 404 });
        });
        const getCart = vi.fn(async () => serverCart);
        const beforePayment = vi.fn(async () => {
            serverCart = { ...response, cart: { ...response.cart, buyerContactPinned: true } };
        });
        const setupCardPayment = vi.fn(async () => {
            expect(cart.getSnapshot().cart?.buyerContactPinned).toBe(true);
            return paymentSetup(serverCart);
        });
        const client = { getCart, getOrder, setupCardPayment } as unknown as ZynoSalesClient;
        const cart = new CartSession({ client, storage: new TestStorage(), storageKey: 'cart' });
        cart.accept(response);
        const checkout = new CheckoutCoordinator({
            cartSession: cart,
            client,
            storage: new TestStorage(),
            pendingPaymentKey: 'payment',
            hooks: { beforePayment }
        });

        const setup = await checkout.beginCardPayment();

        expect(setup?.cart.buyerContactPinned).toBe(true);
        expect(beforePayment).toHaveBeenCalledWith({
            cart: response.cart,
            cartAccess: { cartId: response.cartId, cartKey: response.cartKey }
        });
        expect(setupCardPayment).toHaveBeenCalledOnce();
    });

    it('reuses a pending setup idempotency key after a timeout', async () => {
        const response = cartResponse();
        const setup = paymentSetup(response);
        const beforePayment = vi.fn();
        const getOrder = vi.fn(async () => {
            throw new ZynoSalesError('Order is not ready.', { status: 404 });
        });
        const getCart = vi.fn(async () => response);
        const setupCardPayment = vi.fn()
            .mockRejectedValueOnce(new ZynoSalesError('Timed out.'))
            .mockResolvedValueOnce(setup);
        const client = { getCart, getOrder, setupCardPayment } as unknown as ZynoSalesClient;
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const cart = new CartSession({ client, storage: cartStorage, storageKey: 'cart' });
        cart.accept(response);
        const checkout = new CheckoutCoordinator({
            cartSession: cart,
            client,
            storage: paymentStorage,
            pendingPaymentKey: 'payment',
            hooks: { beforePayment }
        });

        await expect(checkout.beginCardPayment()).rejects.toThrow('Timed out.');
        const pendingAfterTimeout = JSON.parse(paymentStorage.getItem('payment')!) as { idempotencyKey: string };
        const recoveredSetup = await checkout.beginCardPayment();

        expect(recoveredSetup).toEqual(setup);
        expect(setupCardPayment).toHaveBeenCalledTimes(2);
        expect(setupCardPayment.mock.calls[0]?.[2]).toEqual({ idempotencyKey: pendingAfterTimeout.idempotencyKey });
        expect(setupCardPayment.mock.calls[1]?.[2]).toEqual({ idempotencyKey: pendingAfterTimeout.idempotencyKey });
        expect(beforePayment).toHaveBeenCalledTimes(1);
    });

    it('clears a completed cart and invokes the completion hook once across repeated reads', async () => {
        const response = cartResponse();
        const order = paidOrder();
        const afterOrderCompleted = vi.fn();
        const confirmCardPayment = vi.fn(async () => order);
        const getOrder = vi.fn(async () => order);
        const client = { confirmCardPayment, getOrder } as unknown as ZynoSalesClient;
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const cart = new CartSession({ client, storage: cartStorage, storageKey: 'cart' });
        cart.accept(response);
        const checkout = new CheckoutCoordinator({
            cartSession: cart,
            client,
            storage: paymentStorage,
            pendingPaymentKey: 'payment',
            hooks: { afterOrderCompleted }
        });

        await checkout.completeCardPayment({ paymentAttemptId: 'attempt-1', paymentIntentId: 'intent-1' });
        await checkout.getOrder();

        expect(cart.getSnapshot()).toMatchObject({ cart: null, hasCart: false });
        expect(checkout.getSnapshot().order).toEqual(order);
        expect(afterOrderCompleted).toHaveBeenCalledTimes(1);

        const reloadedCheckout = new CheckoutCoordinator({
            cartSession: cart,
            client,
            storage: paymentStorage,
            pendingPaymentKey: 'payment',
            hooks: { afterOrderCompleted }
        });
        const recoveredOrder = await reloadedCheckout.recoverPayment();

        expect(recoveredOrder).toEqual(order);
        expect(afterOrderCompleted).toHaveBeenCalledTimes(1);
    });

    it('recovers account order history through the customer endpoint without an order key', async () => {
        const accountOrder: Order = {
            id: 'order-account-1',
            source: 'ecomm',
            saleNumber: 'S-ACCOUNT-1',
            status: 'paid',
            createdAt: '2026-01-01T00:00:00.000Z',
            closedAt: '2026-01-01T00:01:00.000Z',
            items: [],
            totals: { discounted: 1000, base: 1000, tax: 0, total: 1000, paid: 1000, due: 0 },
            paymentStatus: 'captured',
            fulfillmentStatus: null
        };
        const getCustomerOrder = vi.fn(async () => accountOrder);
        const getOrder = vi.fn();
        const client = { getCustomerOrder, getOrder } as unknown as ZynoSalesClient;
        const paymentStorage = new TestStorage();
        paymentStorage.setItem('payment:completed', JSON.stringify({
            version: 2,
            mode: 'account',
            cartId: 'cart-account-1',
            orderId: accountOrder.id,
            scope: { policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' },
            orderKey: 'stale-guest-capability'
        }));
        const { checkout } = checkoutFixture(client, paymentStorage);

        const recoveredOrder = await checkout.getOrder();

        expect(recoveredOrder).toEqual(accountOrder);
        expect(getCustomerOrder).toHaveBeenCalledWith(accountOrder.id);
        expect(getOrder).not.toHaveBeenCalled();
        expect(paymentStorage.getItem('payment:completed')).not.toContain('orderKey');
    });

    it('finalizes a zero-due account cart and reads the resulting order through customer history', async () => {
        const response = cartResponse('account-free', 0);
        response.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const accountOrder: Order = {
            id: 'account-free', source: 'ecomm', saleNumber: 'S-FREE', status: 'paid',
            createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-01T00:01:00.000Z',
            items: [], totals: { discounted: 0, base: 0, tax: 0, total: 0, paid: 0, due: 0 },
            paymentStatus: null, fulfillmentStatus: null
        };
        const getCustomerOrder = vi.fn()
            .mockRejectedValueOnce(new ZynoSalesError('Order is not ready.', { status: 404 }))
            .mockResolvedValueOnce(accountOrder);
        const getOrder = vi.fn();
        const finalizeZeroDueCart = vi.fn(async () => response);
        const client = { finalizeZeroDueCart, getCustomerOrder, getOrder } as unknown as ZynoSalesClient;
        const { cart, checkout, storage } = checkoutFixture(client);
        cart.accept(response);

        const setup = await checkout.beginCardPayment();

        expect(setup).toBeNull();
        expect(finalizeZeroDueCart).toHaveBeenCalledWith('account-free', 'account-free-secret');
        expect(getCustomerOrder).toHaveBeenNthCalledWith(2, 'account-free');
        expect(getOrder).not.toHaveBeenCalled();
        expect(storage.getItem('payment:completed')).not.toContain('orderKey');
        expect(cart.getSnapshot()).toMatchObject({ cart: null, hasCart: false });
    });

    it('preserves account cart and pending payment references when order recovery needs reauthentication', async () => {
        const response = cartResponse('account-pending');
        response.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const getCustomerOrder = vi.fn(async () => {
            throw new ZynoSalesError('Sign in again.', { status: 401, code: 'REAUTHENTICATION_REQUIRED' });
        });
        const getPaymentAttempt = vi.fn();
        const client = { getCustomerOrder, getPaymentAttempt } as unknown as ZynoSalesClient;
        const paymentStorage = new TestStorage();
        const pending = {
            cartId: response.cartId, idempotencyKey: 'idem-1', paymentAttemptId: 'attempt-1',
            paymentIntentId: 'intent-1', kind: 'payment'
        };
        paymentStorage.setItem('payment', JSON.stringify(pending));
        const { cart, checkout } = checkoutFixture(client, paymentStorage);
        cart.accept(response);

        await expect(checkout.recoverPayment()).rejects.toMatchObject({ code: 'REAUTHENTICATION_REQUIRED', status: 401 });

        expect(cart.getSnapshot()).toMatchObject({ hasCart: true, mode: 'account' });
        expect(paymentStorage.getItem('payment')).toBe(JSON.stringify(pending));
        expect(getPaymentAttempt).not.toHaveBeenCalled();
    });

    it('lets another account start payment without probing the orphan and keeps prior uncertainty for explicit recovery', async () => {
        const oldCart = cartResponse('old-account-cart');
        oldCart.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const newCart = cartResponse('new-account-cart');
        newCart.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const storage = new TestStorage();
        storage.setItem('payment', JSON.stringify({
            cartId: oldCart.cartId,
            idempotencyKey: 'old-idem',
            paymentAttemptId: 'old-attempt',
            paymentIntentId: 'old-intent',
            kind: 'payment'
        }));
        const getCustomerOrder = vi.fn(async (orderId: string) => {
            throw new ZynoSalesError(`No order visible for ${orderId}.`, { status: 404 });
        });
        const setupCardPayment = vi.fn(async () => paymentSetup(newCart));
        const getPaymentAttempt = vi.fn();
        const client = { getCustomerOrder, setupCardPayment, getPaymentAttempt } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client, storage);
        cart.accept(oldCart);
        checkout.detachAccountCartForLogout();

        await expect(checkout.beginCardPayment()).rejects.toThrow('There is no active cart.');
        expect(getCustomerOrder).not.toHaveBeenCalled();
        expect(setupCardPayment).not.toHaveBeenCalled();

        cart.accept(newCart);
        await checkout.beginCardPayment();

        expect(getCustomerOrder.mock.calls.map(([orderId]) => orderId)).toEqual(['new-account-cart']);
        expect(setupCardPayment).toHaveBeenCalledOnce();
        expect(JSON.parse(storage.getItem('payment')!).cartId).toBe('new-account-cart');
        const orphan = JSON.parse(storage.getItem('payment:orphan-account')!);
        expect(orphan.items[0].reference.orderId).toBe('old-account-cart');
        expect(orphan.items[0].pending.paymentAttemptId).toBe('old-attempt');
        expect(JSON.stringify(orphan)).not.toContain('cartKey');
        expect(JSON.stringify(orphan)).not.toContain('orderKey');

        cart.clear();
        await expect(checkout.recoverPayment()).rejects.toMatchObject({ status: 404 });

        expect(getCustomerOrder.mock.calls.map(([orderId]) => orderId)).toEqual(['new-account-cart', 'old-account-cart']);
        expect(storage.getItem('payment:orphan-account')).not.toBeNull();
        expect(JSON.parse(storage.getItem('payment')!).cartId).toBe('new-account-cart');
        expect(getPaymentAttempt).not.toHaveBeenCalled();
    });

    it('detaches on logout with a second unresolved outcome and preserves both for explicit recovery', async () => {
        const first = cartResponse('first-account-cart');
        first.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const second = cartResponse('second-account-cart');
        second.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const third = cartResponse('third-account-cart');
        third.cart.customer = { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' };
        const storage = new TestStorage();
        const client = { setupCardPayment: vi.fn() } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client, storage);

        cart.accept(first);
        storage.setItem('payment', JSON.stringify({ cartId: first.cartId, idempotencyKey: 'idem-1', paymentAttemptId: 'attempt-1' }));
        expect(() => checkout.detachAccountCartForLogout()).not.toThrow();
        cart.accept(second);
        storage.setItem('payment', JSON.stringify({ cartId: second.cartId, idempotencyKey: 'idem-2', paymentAttemptId: 'attempt-2' }));

        expect(() => checkout.detachAccountCartForLogout()).not.toThrow();

        expect(cart.getSnapshot()).toMatchObject({ hasCart: false, mode: null });
        expect(storage.getItem('payment')).toBeNull();
        expect(JSON.parse(storage.getItem('payment:orphan-account')!).items).toHaveLength(2);

        cart.accept(third);
        expect(() => checkout.detachAccountCartForLogout()).not.toThrow();
        expect(JSON.parse(storage.getItem('payment:orphan-account')!).items).toHaveLength(2);
    });

    it('clears the cart after zero-due finalization', async () => {
        const response = cartResponse('cart-free', 0);
        const order = paidOrder('cart-free');
        const getOrder = vi.fn()
            .mockRejectedValueOnce(new ZynoSalesError('Order is not ready.', { status: 404 }))
            .mockResolvedValueOnce(order);
        const finalizeZeroDueCart = vi.fn(async () => response);
        const setupCardPayment = vi.fn();
        const client = { finalizeZeroDueCart, getOrder, setupCardPayment } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client);
        cart.accept(response);

        const setup = await checkout.beginCardPayment();

        expect(setup).toBeNull();
        expect(finalizeZeroDueCart).toHaveBeenCalledWith('cart-free', 'cart-free-secret');
        expect(setupCardPayment).not.toHaveBeenCalled();
        expect(cart.getSnapshot()).toMatchObject({ cart: null, hasCart: false });
        expect(checkout.getSnapshot().order).toEqual(order);
    });

    it('resets the completed order when a new cart starts', async () => {
        const firstResponse = cartResponse();
        const secondResponse = cartResponse('cart-2');
        const secondSetup = paymentSetup(secondResponse);
        const order = paidOrder();
        const getOrder = vi.fn(async () => {
            throw new ZynoSalesError('Order is not ready.', { status: 404 });
        });
        const client = {
            confirmCardPayment: vi.fn(async () => order),
            createCart: vi.fn(async () => secondResponse),
            getOrder,
            setupCardPayment: vi.fn(async () => secondSetup)
        } as unknown as ZynoSalesClient;
        const { cart, checkout } = checkoutFixture(client);
        cart.accept(firstResponse);

        await checkout.completeCardPayment({ paymentAttemptId: 'attempt-1', paymentIntentId: 'intent-1' });
        await cart.add({ productId: 'product-1', qty: 1 });
        const setup = await checkout.beginCardPayment();

        expect(checkout.getSnapshot().order).toBeNull();
        expect(setup).toEqual(secondSetup);
    });

    it('migrates pending and completed payment state to a scoped storage key', () => {
        const client = {} as ZynoSalesClient;
        const storage = new TestStorage();
        storage.setItem('provisional', JSON.stringify({ cartId: 'cart-1', idempotencyKey: 'key-1' }));
        storage.setItem('provisional:completed', JSON.stringify({
            cartId: 'cart-0',
            orderId: 'order-0',
            orderKey: 'order-key-0'
        }));
        const { checkout } = checkoutFixture(client, storage, 'provisional');

        checkout.setStorageKey('scoped');

        expect(storage.getItem('provisional')).toBeNull();
        expect(storage.getItem('provisional:completed')).toBeNull();
        expect(storage.getItem('scoped')).toContain('key-1');
        expect(storage.getItem('scoped:completed')).toContain('order-0');
    });
});

function recurringFreeCart(): CartResponse {
    const response = cartResponse('cart-free-membership', 0);
    response.cart.membershipRequirements = { buyerRequired: false, billingAddressRequired: false, recurringConsentRequired: false,
        paymentMethodSetupRequired: true, termsHash: 'server-terms', acceptedTermsHash: 'server-terms' };
    return response;
}

it('uses SetupIntent confirmation for a free introductory membership and keeps its client secret transient', async () => {
    const response = recurringFreeCart();
    const setup = { ...response, paymentAttemptId: 'setup-attempt', setupIntentId: 'seti_membership', clientSecret: 'seti_private_secret', amount: 0 };
    const setupMembershipCard = vi.fn(async () => setup);
    const confirmMembershipCard = vi.fn(async () => paidOrder(response.cartId));
    const finalizeZeroDueCart = vi.fn();
    const client = { getOrder: vi.fn(async () => ({ ...paidOrder(response.cartId), status: 'open' })), setupMembershipCard,
        confirmMembershipCard, finalizeZeroDueCart } as unknown as ZynoSalesClient;
    const { cart, checkout, storage } = checkoutFixture(client);
    cart.accept(response);
    const result = await checkout.beginCardPayment();
    expect(result).toEqual(setup);
    expect(finalizeZeroDueCart).not.toHaveBeenCalled();
    expect(JSON.stringify(checkout.getSnapshot())).not.toContain('seti_private_secret');
    expect(JSON.stringify([...storage.values.values()])).not.toContain('seti_private_secret');
    expect(JSON.parse(storage.getItem('payment')!)).toMatchObject({ kind: 'setup', setupIntentId: 'seti_membership' });
    const order = await checkout.completeMembershipCardSetup({ paymentAttemptId: 'setup-attempt', setupIntentId: 'seti_membership' });
    expect(order.status).toBe('paid');
    expect(confirmMembershipCard).toHaveBeenCalledWith(response.cartId, `${response.cartId}-secret`, { paymentAttemptId: 'setup-attempt', setupIntentId: 'seti_membership' });
    expect(storage.getItem('payment')).toBeNull();
});

it('recovers a confirmed membership SetupIntent after a reload', async () => {
    const response = recurringFreeCart();
    const storage = new TestStorage();
    storage.setItem('payment', JSON.stringify({ cartId: response.cartId, kind: 'setup', idempotencyKey: 'stable-key', paymentAttemptId: 'setup-attempt', setupIntentId: 'seti_membership' }));
    const confirmMembershipCard = vi.fn(async () => paidOrder(response.cartId));
    const confirmCardPayment = vi.fn();
    const client = { getOrder: vi.fn(async () => ({ ...paidOrder(response.cartId), status: 'open' })),
        getPaymentAttempt: vi.fn(async () => ({ id: 'setup-attempt', status: 'authorized', kind: 'setup', setupIntentId: 'seti_membership' })),
        confirmMembershipCard, confirmCardPayment } as unknown as ZynoSalesClient;
    const { cart, checkout } = checkoutFixture(client, storage);
    cart.accept(response);
    const order = await checkout.recoverPayment();
    expect(order?.status).toBe('paid');
    expect(confirmMembershipCard).toHaveBeenCalledOnce();
    expect(confirmCardPayment).not.toHaveBeenCalled();
});

it('forwards explicit server terms acceptance and clears stale local payment recovery', async () => {
    const response = recurringFreeCart();
    const acceptMembershipTerms = vi.fn(async () => response);
    const { cart, checkout, storage } = checkoutFixture({ acceptMembershipTerms } as unknown as ZynoSalesClient);
    cart.accept(response);
    storage.setItem('payment', JSON.stringify({ cartId: response.cartId, idempotencyKey: 'old-key' }));
    await checkout.acceptMembershipTerms({ termsHash: 'server-terms' });
    expect(acceptMembershipTerms).toHaveBeenCalledWith(response.cartId, `${response.cartId}-secret`, { termsHash: 'server-terms' });
    expect(storage.getItem('payment')).toBeNull();
});
