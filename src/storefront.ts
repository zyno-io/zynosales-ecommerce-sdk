import { CartSession } from './cart';
import { CatalogApi } from './catalog';
import { CheckoutCoordinator } from './checkout';
import { CustomerAuth, type CustomerInitializationOptions } from './customer';
import { ZynoSalesClient } from './client';
import { resolveApiBase, storageNamespace, type ZynoSalesEnvironment } from './configuration';
import { defaultPersistentStorage, defaultSessionStorage, resolveCustomerSessionStorage, type ZynoSalesStorage } from './storage';
import { SerialQueue } from './queue';
import type { StorefrontConfig, StripeBrowserConfiguration, ZynoSalesHooks } from './types';

/** Common storefront configuration shared by environment and explicit-base setup. */
export type ZynoSalesSharedOptions = {
    /** Storefront publishable key (`zs_pk_...`). Safe to embed in browser bundles. */
    publishableKey: string;
    /** Custom fetch implementation for tests or non-browser hosts. Defaults to global `fetch`. */
    fetch?: typeof fetch;
    /** Persistent storage for cart/order capabilities. Defaults to `localStorage` in browsers. */
    storage?: ZynoSalesStorage;
    /** Session storage for payment recovery markers. Defaults to `sessionStorage` in browsers. */
    sessionStorage?: ZynoSalesStorage;
    /** Private customer-session storage. Defaults to `sessionStorage`; pass `localStorage` for longer continuity. */
    customerStorage?: ZynoSalesStorage;
    /** Customer flows the SDK may offer for this instance. The server policy can only narrow this subset. */
    customer?: { options?: CustomerInitializationOptions };
    /** Lifecycle callbacks for cart changes, payment policy, and completed orders. */
    hooks?: ZynoSalesHooks;
};

/**
 * Creates an SDK instance using a built-in Sales endpoint or an explicit API base.
 *
 * Provide either a built-in `environment` or an explicit `apiBase`. The two
 * options are mutually exclusive. Non-local bases must use HTTPS.
 */
export type ZynoSalesOptions = ZynoSalesSharedOptions &
    (
        | { environment?: ZynoSalesEnvironment; apiBase?: never }
        | { environment?: never; apiBase: string }
    );

/** A complete, JavaScript-only ecommerce storefront instance. */
export type ZynoSalesStorefront = {
    /** Low-level generated Sales client for advanced integrations. */
    readonly client: ZynoSalesClient;
    /** Product catalog reads with an explicit in-memory list cache. */
    readonly catalog: CatalogApi;
    /** Persistent cart session with serialized mutations and render-safe snapshots. */
    readonly cart: CartSession;
    /** Buyer, delivery, discount, payment, and recovery workflows. */
    readonly checkout: CheckoutCoordinator;
    /** Customer auth, account orders, and account-cart binding. UI remains host-owned. */
    readonly customer: CustomerAuth;
    /** Cached runtime storefront configuration from Sales. */
    getConfig(): Promise<StorefrontConfig>;
    /** Forces a fresh configuration read from Sales. */
    refreshConfig(): Promise<StorefrontConfig>;
    /** Stripe.js options derived from runtime configuration, or `null` when cards are unavailable. */
    getStripeConfiguration(): Promise<StripeBrowserConfiguration | null>;
};

/** Creates a complete ecommerce SDK instance. It renders no UI and has no framework dependency. */
export function createZynoSales(options: ZynoSalesOptions): ZynoSalesStorefront {
    const environment = 'environment' in options && options.environment ? options.environment : 'production';
    const apiBase = resolveApiBase(environment, options.apiBase);
    const storage = options.storage ?? defaultPersistentStorage();
    const sessionStorage = options.sessionStorage ?? defaultSessionStorage();
    if (options.customerStorage && options.customerStorage === storage) {
        throw new Error('Customer session storage must be separate from cart capability storage.');
    }
    const resolvedCustomerStorage = resolveCustomerSessionStorage(options.customerStorage);
    const client = new ZynoSalesClient({ apiBase, publishableKey: options.publishableKey, ...(options.fetch ? { fetch: options.fetch } : {}) });
    const provisionalNamespace = storageNamespace(apiBase, `key:${options.publishableKey}`);
    const cartQueue = new SerialQueue();
    const checkoutQueue = new SerialQueue();
    const cart = new CartSession({ client, storage, storageKey: `${provisionalNamespace}:cart`, queue: cartQueue });
    const checkout = new CheckoutCoordinator({
        client,
        cartSession: cart,
        storage: sessionStorage,
        pendingPaymentKey: `${provisionalNamespace}:payment`,
        hooks: options.hooks ?? {},
        queue: checkoutQueue
    });
    const customer = new CustomerAuth({
        client,
        cart,
        checkout,
        storage: resolvedCustomerStorage.storage,
        restrictedStorage: defaultSessionStorage(),
        storageMode: resolvedCustomerStorage.mode,
        storageKey: `${provisionalNamespace}:customer`,
        namespace: provisionalNamespace,
        apiBase,
        publishableKey: options.publishableKey,
        configuredOptions: options.customer?.options,
        config: () => readConfig(false)
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
        customer.setStorageKey(`${namespace}:customer`, namespace);
        return response;
    }

    return {
        client,
        catalog,
        cart,
        checkout,
        customer,
        getConfig: () => readConfig(false),
        refreshConfig: () => readConfig(true),
        getStripeConfiguration: async () => {
            const storefrontConfig = await readConfig(false);
            return stripeConfiguration(storefrontConfig);
        }
    };
}

/** Creates a raw generated-contract client without cart/session orchestration. */
export function createZynoSalesClient(options: Omit<ZynoSalesOptions, 'hooks' | 'storage' | 'sessionStorage' | 'customerStorage' | 'customer'>): ZynoSalesClient {
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
