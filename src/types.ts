import type {
    ISalesEcommCartItemInput,
    ISalesEcommCartPaymentSetupResponse,
    ISalesEcommCartResponse,
    ISalesEcommOrderResponse,
    ISalesEcommPublicCart,
    ISalesEcommStoreProduct,
    ISalesEcommStorefrontConfigResponse
} from './generated/sales';

import type { PublicError } from './errors';

/** Public product fields currently supported by the embedded storefront contract. */
export type StoreProduct = Pick<
    ISalesEcommStoreProduct,
    'id' | 'name' | 'price' | 'type' | 'slug' | 'description' | 'images' | 'shippingMeta' | 'variant'
>;

/** Generated cart item input from the Sales browser contract. */
export type CartItemInput = ISalesEcommCartItemInput;

/** Authoritative server cart, without cart or order capabilities. */
export type Cart = ISalesEcommPublicCart;

/** Full cart response used by low-level integrations. Capability values must be handled as secrets. */
export type CartResponse = ISalesEcommCartResponse;

/** Card setup response. Its client secret must not be put into render state or logs. */
export type CardPaymentSetup = ISalesEcommCartPaymentSetupResponse;

/** Completed Sales order. */
export type Order = ISalesEcommOrderResponse;

/** Browser-safe storefront configuration supplied at runtime by Sales. */
export type StorefrontConfig = ISalesEcommStorefrontConfigResponse;

/** The render-safe state emitted by the cart session. Capability secrets are never included. */
export type CartSnapshot = {
    /** Last loaded authoritative cart, or `null` before restore. */
    cart: Cart | null;
    /** Whether a persisted cart capability currently exists. */
    hasCart: boolean;
    /** True while a cart restore or mutation is in flight. */
    isBusy: boolean;
    /** Last cart error safe to render in UI. */
    lastError: PublicError | null;
};

/** The render-safe state emitted by checkout. Capability secrets are never included. */
export type CheckoutSnapshot = {
    /** Completed public order when available. */
    order: Order | null;
    /** Active payment attempt id while setup/recovery is tracked. */
    paymentAttemptId: string | null;
    /** Active payment attempt status while setup/recovery is tracked. */
    paymentAttemptStatus: string | null;
    /** True while a checkout operation is in flight. */
    isBusy: boolean;
    /** Last checkout error safe to render in UI. */
    lastError: PublicError | null;
};

/**
 * A one-call, privileged cart reference for a trusted merchant server request.
 * Treat as a secret: never put in URLs, logs, analytics, or render state.
 */
export type CartServerAccess = {
    /** Sales cart id. */
    cartId: string;
    /** Transient cart capability for the merchant server only. */
    cartKey: string;
};

/** Hooks that let a host integrate server-owned policy without UI components. */
export type ZynoSalesHooks = {
    /**
     * Runs before a new payment setup. Throw/reject to block payment.
     * Not rerun when recovering the same persisted setup.
     */
    beforePayment?: (context: { cart: Cart; cartAccess: CartServerAccess }) => Promise<void> | void;
    /**
     * Runs once after Sales returns a paid order from confirmation, zero-due
     * finalization, or recovery. Failures are swallowed by the SDK.
     */
    afterOrderCompleted?: (context: { order: Order; cartId: string }) => Promise<void> | void;
    /** Application-wide cart snapshot listener; equivalent to `cart.subscribe` without unsubscribe. */
    onCartChanged?: (snapshot: CartSnapshot) => void;
};

/** A Stripe configuration that can be passed to `loadStripe` without bundling Stripe into this SDK. */
export type StripeBrowserConfiguration = {
    /** Stripe publishable key from Sales runtime configuration. */
    publishableKey: string;
    /** Connected account id when Sales operates in connected-account mode. */
    stripeAccount?: string;
};
