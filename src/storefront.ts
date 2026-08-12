import { CartSession } from './cart';
import { CatalogApi } from './catalog';
import { CheckoutCoordinator } from './checkout';
import { ZynoSalesClient } from './client';
import { resolveApiBase, storageNamespace, type ZynoSalesEnvironment } from './configuration';
import { defaultPersistentStorage, defaultSessionStorage, type ZynoSalesStorage } from './storage';
import type { StorefrontConfig, StripeBrowserConfiguration, ZynoSalesHooks } from './types';

/** Common storefront configuration shared by environment and explicit-base setup. */
export type ZynoSalesSharedOptions = {
    publishableKey: string;
    fetch?: typeof fetch;
    storage?: ZynoSalesStorage;
    sessionStorage?: ZynoSalesStorage;
    hooks?: ZynoSalesHooks;
};

/** Creates an SDK instance using an embedded production or alpha Sales endpoint. */
export type ZynoSalesOptions = ZynoSalesSharedOptions &
    (
        | { environment?: ZynoSalesEnvironment; apiBase?: never }
        | { environment?: never; apiBase: string }
    );

/** A complete, JavaScript-only ecommerce storefront instance. */
export type ZynoSalesStorefront = {
    readonly client: ZynoSalesClient;
    readonly catalog: CatalogApi;
    readonly cart: CartSession;
    readonly checkout: CheckoutCoordinator;
    getConfig(): Promise<StorefrontConfig>;
    refreshConfig(): Promise<StorefrontConfig>;
    getStripeConfiguration(): Promise<StripeBrowserConfiguration | null>;
};

/** Creates a complete ecommerce SDK instance. It renders no UI and has no framework dependency. */
export function createZynoSales(options: ZynoSalesOptions): ZynoSalesStorefront {
    const environment = 'environment' in options && options.environment ? options.environment : 'production';
    const apiBase = resolveApiBase(environment, options.apiBase);
    const storage = options.storage ?? defaultPersistentStorage();
    const sessionStorage = options.sessionStorage ?? defaultSessionStorage();
    const client = new ZynoSalesClient({ apiBase, publishableKey: options.publishableKey, ...(options.fetch ? { fetch: options.fetch } : {}) });
    const provisionalNamespace = storageNamespace(apiBase, `key:${options.publishableKey}`);
    const cart = new CartSession({ client, storage, storageKey: `${provisionalNamespace}:cart` });
    const checkout = new CheckoutCoordinator({
        client,
        cartSession: cart,
        storage: sessionStorage,
        pendingPaymentKey: `${provisionalNamespace}:payment`,
        hooks: options.hooks ?? {}
    });
    const catalog = new CatalogApi(client);
    let config: StorefrontConfig | null = null;

    cart.setMutationListener(() => checkout.invalidatePayment());
    if (options.hooks?.onCartChanged) cart.subscribe(options.hooks.onCartChanged);

    async function readConfig(refresh: boolean): Promise<StorefrontConfig> {
        if (config && !refresh) return config;
        const response = await client.getConfig();
        config = response;
        const namespace = storageNamespace(apiBase, response.tenantId);
        checkout.setStorageKey(`${namespace}:payment`);
        cart.setStorageKey(`${namespace}:cart`);
        return response;
    }

    return {
        client,
        catalog,
        cart,
        checkout,
        getConfig: () => readConfig(false),
        refreshConfig: () => readConfig(true),
        getStripeConfiguration: async () => {
            const storefrontConfig = await readConfig(false);
            return stripeConfiguration(storefrontConfig);
        }
    };
}

/** Creates a raw generated-contract client without cart/session orchestration. */
export function createZynoSalesClient(options: Omit<ZynoSalesOptions, 'hooks' | 'storage' | 'sessionStorage'>): ZynoSalesClient {
    const environment = 'environment' in options && options.environment ? options.environment : 'production';
    const apiBase = resolveApiBase(environment, options.apiBase);
    return new ZynoSalesClient({ apiBase, publishableKey: options.publishableKey, ...(options.fetch ? { fetch: options.fetch } : {}) });
}

/** Converts browser-safe Sales configuration to the options expected by Stripe.js. */
export function stripeConfiguration(config: StorefrontConfig): StripeBrowserConfiguration | null {
    const payments = config.payments;
    if (!payments.cardEnabled || !payments.stripePublishableKey) return null;
    return {
        publishableKey: payments.stripePublishableKey,
        ...(payments.stripeConnectedAccountId ? { stripeAccount: payments.stripeConnectedAccountId } : {})
    };
}
