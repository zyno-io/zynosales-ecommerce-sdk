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
