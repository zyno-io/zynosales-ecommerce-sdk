/**
 * Framework-neutral JavaScript APIs for a ZynoSales embedded ecommerce storefront.
 * The SDK owns API workflows and state; the website owns all UI.
 *
 * @packageDocumentation
 */

export { CatalogApi } from './catalog';
export { CartSession } from './cart';
export { CheckoutCoordinator } from './checkout';
export { ZynoSalesClient } from './client';
export { SALES_API_BASES, resolveApiBase, type ZynoSalesEnvironment } from './configuration';
export { ZynoSalesError, type PublicError } from './errors';
export {
    createZynoSales,
    createZynoSalesClient,
    stripeConfiguration,
    type ZynoSalesOptions,
    type ZynoSalesSharedOptions,
    type ZynoSalesStorefront
} from './storefront';
export type {
    CardPaymentSetup,
    Cart,
    CartItemInput,
    CartResponse,
    CartServerAccess,
    CartSnapshot,
    CheckoutSnapshot,
    Order,
    StorefrontConfig,
    StoreProduct,
    StripeBrowserConfiguration,
    ZynoSalesHooks
} from './types';
export type { ZynoSalesStorage } from './storage';

/** Generated browser-facing Sales contract types for advanced integrations. */
export type {
    ISalesEcommAddressVerificationInput,
    ISalesEcommBuyerInput,
    ISalesEcommCartItemInput,
    ISalesEcommCartPaymentSetupResponse,
    ISalesEcommCartResponse,
    ISalesEcommCartDiscountCodeInput,
    ISalesEcommCartFulfillmentInput,
    ISalesEcommCartShippingRatesInput,
    ISalesEcommOrderResponse,
    ISalesEcommPaymentAttemptResponse,
    ISalesEcommPublicCart,
    ISalesEcommShippingRatesResponse,
    ISalesEcommShippingSelectionQuoteInput,
    ISalesEcommShippingSelectionQuoteResponse,
    ISalesEcommStoreProduct,
    ISalesEcommStorefrontConfigResponse,
    ISalesFulfillmentAddressVerificationResponse,
    ISalesFulfillmentShippingCalculateRequestAddressDetail,
    ISalesFulfillmentVerifiedAddress,
    ISalesFullfillmentAddress,
    SalesFulfillmentOrderRecipient,
    SalesPredefinedDiscountScope,
    IValidateDiscountCodeResponse
} from './generated/sales';
