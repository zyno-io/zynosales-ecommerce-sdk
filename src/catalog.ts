import type { ZynoSalesClient } from './client';
import type { StoreProduct } from './types';
import type { ISalesEcommStoreProduct } from './generated/sales';

/** Explicit catalog reads and cache control. The current storefront API has no modifier contract yet. */
export class CatalogApi {
    private readonly client: ZynoSalesClient;
    private products: StoreProduct[] | null = null;

    public constructor(client: ZynoSalesClient) {
        this.client = client;
    }

    /** Fetches products, returning the explicit cache unless `refresh` is requested. */
    public async getProducts(options: { refresh?: boolean } = {}): Promise<StoreProduct[]> {
        if (this.products && !options.refresh) return this.products;
        const products = await this.client.getProducts();
        this.products = products.map(projectProduct);
        return this.products;
    }

    /** Fetches one product by slug. */
    public async getProduct(slug: string): Promise<StoreProduct> {
        const product = await this.client.getProduct(slug);
        return projectProduct(product);
    }

    /** Clears the in-memory product cache. */
    public clearCache(): void {
        this.products = null;
    }
}

function projectProduct(product: ISalesEcommStoreProduct): StoreProduct {
    return {
        id: product.id,
        name: product.name,
        price: product.price,
        type: product.type,
        slug: product.slug,
        description: product.description,
        images: product.images,
        ...(product.shippingMeta === undefined ? {} : { shippingMeta: product.shippingMeta }),
        ...(product.variant === undefined ? {} : { variant: product.variant })
    };
}
