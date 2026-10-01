import { describe, expect, it, vi } from 'vitest';

import { CatalogApi } from '../src/catalog';
import type { ZynoSalesClient } from '../src/client';

describe('CatalogApi', () => {
    it('preserves product type and variant metadata', async () => {
        const product = {
            id: 'product-1',
            name: 'Ring',
            price: 12500,
            type: 'variant' as const,
            slug: 'ring-size-7',
            description: 'A ring',
            images: [],
            variant: {
                groupId: 'group-1',
                groupSlug: 'ring',
                groupName: 'Ring',
                options: [{ id: 'size', name: 'Size', values: ['7', '8'] }],
                values: { size: '7' }
            }
        };
        const getProducts = vi.fn(async () => [product]);
        const client = { getProducts } as unknown as ZynoSalesClient;
        const catalog = new CatalogApi(client);

        const products = await catalog.getProducts();

        expect(products[0]).toMatchObject({
            type: 'variant',
            variant: {
                groupId: 'group-1',
                values: { size: '7' }
            }
        });
    });
});

it('preserves server-provided membership tiers in the public catalog', async () => {
    const { membershipTerms } = await import('./membership-fixtures');
    const membership = { membershipTypeId: membershipTerms.membershipTypeId, name: 'Membership',
        defaultPricingTierId: membershipTerms.pricingTierId, pricingTiers: [membershipTerms] };
    const client = { getProducts: vi.fn(async () => [{ id: 'membership-product', name: 'Membership', price: 0,
        type: 'membership', slug: 'membership', description: '', images: [], membership, internalBillingAccountId: 'private' }]) } as unknown as ZynoSalesClient;
    const catalog = new CatalogApi(client);
    const products = await catalog.getProducts();
    expect(products[0]?.membership).toEqual(membership);
    expect(JSON.stringify(products)).not.toContain('internalBillingAccountId');
});
