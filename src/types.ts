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
export type StoreProduct = Pick<ISalesEcommStoreProduct, 'id' | 'name' | 'price' | 'slug' | 'description' | 'images' | 'shippingMeta'>;

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

/** The render-safe state emitted by the cart session. */
export type CartSnapshot = {
    cart: Cart | null;
    hasCart: boolean;
    isBusy: boolean;
    lastError: PublicError | null;
};

/** The render-safe state emitted by checkout. */
export type CheckoutSnapshot = {
    order: Order | null;
    paymentAttemptId: string | null;
    paymentAttemptStatus: string | null;
    isBusy: boolean;
    lastError: PublicError | null;
};

/** A one-call, privileged cart reference for a trusted merchant server request. */
export type CartServerAccess = {
    cartId: string;
    cartKey: string;
};

/** Hooks that let a host integrate server-owned policy without UI components. */
export type ZynoSalesHooks = {
    beforePayment?: (context: { cart: Cart; cartAccess: CartServerAccess }) => Promise<void> | void;
    afterOrderCompleted?: (context: { order: Order; cartId: string }) => Promise<void> | void;
    onCartChanged?: (snapshot: CartSnapshot) => void;
};

/** A Stripe configuration that can be passed to `loadStripe` without bundling Stripe into this SDK. */
export type StripeBrowserConfiguration = {
    publishableKey: string;
    stripeAccount?: string;
};
