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
