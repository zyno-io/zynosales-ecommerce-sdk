import { describe, expect, it } from 'vitest';

import { storageNamespace } from '../src/configuration';
import type { ZynoSalesStorage } from '../src/storage';
import { createZynoSales } from '../src/storefront';

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

describe('createZynoSales storage', () => {
    it('isolates provisional state by publishable key and rekeys both state stores', async () => {
        const apiBase = 'https://sales.example';
        const storage = new TestStorage();
        const sessionStorage = new TestStorage();
        const firstNamespace = storageNamespace(apiBase, 'key:publishable-1');
        const secondNamespace = storageNamespace(apiBase, 'key:publishable-2');
        const tenantNamespace = storageNamespace(apiBase, 'tenant-1');
        storage.setItem(`${firstNamespace}:cart`, JSON.stringify({
            cartId: 'cart-1',
            cartKey: 'cart-secret',
            orderKey: 'order-secret'
        }));
        sessionStorage.setItem(`${firstNamespace}:payment`, JSON.stringify({
            cartId: 'cart-1',
            idempotencyKey: 'payment-key'
        }));
        const fetch: typeof globalThis.fetch = async () => Response.json({
            tenantId: 'tenant-1',
            currency: 'usd',
            payments: {
                cardEnabled: false,
                stripeEnvironment: 'production',
                stripePublishableKey: null,
                stripeConnectedAccountId: null
            },
            capabilities: { addressVerification: true, shipping: true, discountCodes: true }
        });

        const first = createZynoSales({ apiBase, publishableKey: 'publishable-1', storage, sessionStorage, fetch });
        const second = createZynoSales({ apiBase, publishableKey: 'publishable-2', storage, sessionStorage, fetch });

        expect(first.cart.getSnapshot().hasCart).toBe(true);
        expect(second.cart.getSnapshot().hasCart).toBe(false);
        expect(storage.getItem(`${secondNamespace}:cart`)).toBeNull();

        await first.getConfig();

        expect(storage.getItem(`${firstNamespace}:cart`)).toBeNull();
        expect(storage.getItem(`${tenantNamespace}:cart`)).toContain('cart-1');
        expect(sessionStorage.getItem(`${firstNamespace}:payment`)).toBeNull();
        expect(sessionStorage.getItem(`${tenantNamespace}:payment`)).toContain('payment-key');
    });
});
