import { describe, expect, it } from 'vitest';

import { resolveApiBase } from '../src/configuration';
import { stripeConfiguration } from '../src/storefront';
import type { StorefrontConfig } from '../src/types';

describe('endpoint and Stripe configuration', () => {
    it('uses production by default and supports alpha without a URL override', () => {
        expect(resolveApiBase()).toBe('https://sales.api.zyno.app');
        expect(resolveApiBase('alpha')).toBe('https://sales.api-alpha.zyno.dev');
    });

    it('allows an explicit localhost override for development', () => {
        expect(resolveApiBase('production', 'http://localhost:39875/')).toBe('http://localhost:39875');
    });

    it('includes Stripe connected account only when Sales provides it', () => {
        const config: StorefrontConfig = {
            tenantId: 'tenant-1',
            currency: 'usd',
            payments: {
                cardEnabled: true,
                stripeEnvironment: 'live',
                stripePublishableKey: 'pk_test_123',
                stripeConnectedAccountId: 'acct_123'
            },
            capabilities: { addressVerification: true, shipping: true, discountCodes: true }
        };

        expect(stripeConfiguration(config)).toEqual({ publishableKey: 'pk_test_123', stripeAccount: 'acct_123' });
        expect(stripeConfiguration({
            ...config,
            payments: { ...config.payments, stripeConnectedAccountId: null }
        })).toEqual({ publishableKey: 'pk_test_123' });
    });
});
