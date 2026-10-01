import { describe, expect, it, vi } from 'vitest';

import { ZynoSalesClient } from '../src/client';

describe('ZynoSalesClient', () => {
    it('calls a generated operation with the publishable-key header', async () => {
        const fetch: typeof globalThis.fetch = vi.fn(async (input) => {
            const request = new Request(input);
            expect(request.url).toBe('https://sales.example/embedded/sales/ecomm/config');
            expect(request.headers.get('x-zs-publishable-key')).toBe('zs_pk_123');
            return Response.json({
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
        });
        const client = new ZynoSalesClient({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_123', fetch });

        const config = await client.getConfig();

        expect(config.tenantId).toBe('tenant-1');
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});


it('uses embedded membership endpoints and retains the cart capability in headers', async () => {
    const calls: Array<{ path: string; method: string; body: unknown }> = [];
    const fetch: typeof globalThis.fetch = vi.fn(async input => {
        const request = new Request(input);
        expect(request.headers.get('x-zs-publishable-key')).toBe('zs_pk_123');
        expect(request.headers.get('x-zs-cart-key')).toBe('cart-capability');
        expect(request.url).not.toContain('cart-capability');
        const body = await request.json();
        calls.push({ path: new URL(request.url).pathname, method: request.method, body });
        return Response.json({});
    });
    const client = new ZynoSalesClient({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_123', fetch });
    await client.acceptMembershipTerms('cart', 'cart-capability', { termsHash: 'accepted-hash' });
    await client.setupMembershipCard('cart', 'cart-capability', { idempotencyKey: 'stable' });
    await client.confirmMembershipCard('cart', 'cart-capability', { paymentAttemptId: 'attempt', setupIntentId: 'seti_card' });
    expect(calls).toEqual([
        { path: '/embedded/sales/ecomm/carts/cart/membership-terms', method: 'PUT', body: { termsHash: 'accepted-hash' } },
        { path: '/embedded/sales/ecomm/carts/cart/payments/setup-membership-card', method: 'POST', body: { idempotencyKey: 'stable' } },
        { path: '/embedded/sales/ecomm/carts/cart/payments/confirm-setup-intent', method: 'POST', body: { paymentAttemptId: 'attempt', setupIntentId: 'seti_card' } }
    ]);
});
