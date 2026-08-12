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
