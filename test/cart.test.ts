import { describe, expect, it, vi } from 'vitest';

import { CartSession } from '../src/cart';
import type { ZynoSalesClient } from '../src/client';
import type { ZynoSalesStorage } from '../src/storage';
import type { CartResponse } from '../src/types';

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

const firstCart: CartResponse = {
    cartId: 'cart-1',
    cartKey: 'cart-secret',
    orderKey: 'order-secret',
    cart: {
        id: 'cart-1',
        saleNumber: 'S-1',
        status: 'open',
        items: [{
            id: 'line-1',
            qty: 1,
            effectivePrice: 1000,
            notes: null,
            priceBase: 1000,
            priceTax: 0,
            priceTotal: 1000,
            product: { id: 'product-1', type: 'standard', name: 'Product', price: 1000 }
        }],
        priceDiscounted: 1000,
        priceBase: 1000,
        priceTax: 0,
        priceTotal: 1000,
        priceDue: 1000,
        taxes: [],
        taxStatus: 'ok',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        closedAt: null
    }
};

describe('CartSession', () => {
    it('persists capabilities before exposing a render-safe cart snapshot', async () => {
        const storage = new TestStorage();
        const createCart = vi.fn(async () => firstCart);
        const client = { createCart } as unknown as ZynoSalesClient;
        const cart = new CartSession({ client, storage, storageKey: 'cart' });

        await cart.add({ productId: 'product-1', qty: 1 });

        expect(createCart).toHaveBeenCalledWith({ items: [{ productId: 'product-1', qty: 1 }] });
        expect(storage.getItem('cart')).toContain('cart-secret');
        expect(cart.getSnapshot()).toEqual({
            cart: firstCart.cart,
            hasCart: true,
            isBusy: false,
            lastError: null
        });
        expect(JSON.stringify(cart.getSnapshot())).not.toContain('cart-secret');
        expect(JSON.stringify(cart.getSnapshot())).not.toContain('order-secret');
    });

    it('serializes overlapping cart mutations', async () => {
        const storage = new TestStorage();
        const secondCart: CartResponse = {
            ...firstCart,
            cart: { ...firstCart.cart, items: [{ ...firstCart.cart.items[0]!, qty: 2 }], priceDue: 2000 }
        };
        const createCart = vi.fn(async () => firstCart);
        const replaceItems = vi.fn(async () => secondCart);
        const client = { createCart, replaceItems } as unknown as ZynoSalesClient;
        const cart = new CartSession({ client, storage, storageKey: 'cart' });

        await Promise.all([
            cart.add({ productId: 'product-1', qty: 1 }),
            cart.add({ productId: 'product-1', qty: 1 })
        ]);

        expect(createCart).toHaveBeenCalledTimes(1);
        expect(replaceItems).toHaveBeenCalledWith('cart-1', 'cart-secret', {
            items: [{ productId: 'product-1', qty: 2 }]
        });
    });

    it('loads persisted cart lines before adding another product', async () => {
        const storage = new TestStorage();
        storage.setItem('cart', JSON.stringify({
            cartId: 'cart-1',
            cartKey: 'cart-secret',
            orderKey: 'order-secret'
        }));
        const getCart = vi.fn(async () => firstCart);
        const replaceItems = vi.fn(async () => firstCart);
        const client = { getCart, replaceItems } as unknown as ZynoSalesClient;
        const cart = new CartSession({ client, storage, storageKey: 'cart' });

        await cart.add({ productId: 'product-2', qty: 1 });

        expect(getCart).toHaveBeenCalledWith('cart-1', 'cart-secret');
        expect(replaceItems).toHaveBeenCalledWith('cart-1', 'cart-secret', {
            items: [
                { productId: 'product-1', qty: 1 },
                { productId: 'product-2', qty: 1 }
            ]
        });
    });

    it('clears a loaded cart snapshot when a scoped key selects another cart', async () => {
        const storage = new TestStorage();
        storage.setItem('provisional', JSON.stringify({
            cartId: 'cart-1',
            cartKey: 'cart-secret',
            orderKey: 'order-secret'
        }));
        storage.setItem('scoped', JSON.stringify({
            cartId: 'cart-2',
            cartKey: 'cart-secret-2',
            orderKey: 'order-secret-2'
        }));
        const getCart = vi.fn(async () => firstCart);
        const client = { getCart } as unknown as ZynoSalesClient;
        const cart = new CartSession({ client, storage, storageKey: 'provisional' });
        await cart.restore();

        cart.setStorageKey('scoped');

        expect(cart.getSnapshot()).toMatchObject({ cart: null, hasCart: true });
        expect(cart.requireReference()).toEqual({
            cartId: 'cart-2',
            cartKey: 'cart-secret-2',
            orderKey: 'order-secret-2'
        });
        expect(storage.getItem('provisional')).toBeNull();
    });
});
