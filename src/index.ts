/**
 * Framework-neutral JavaScript APIs for a ZynoSales embedded ecommerce storefront.
 * The SDK owns API workflows and state; the website owns all UI.
 *
 * @packageDocumentation
 */

export { CatalogApi } from './catalog';
export { CartSession } from './cart';
export { CheckoutCoordinator } from './checkout';
export { CustomerAuth, type CustomerInitializationOptions } from './customer';
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
    CardCheckoutSetup,
    MembershipCardSetup,
    Cart,
    CartItemInput,
    CartResponse,
    CartServerAccess,
    CartSnapshot,
    CheckoutSnapshot,
    CustomerSnapshot,
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
    ISalesEcommCustomerAuthOptions,
    ISalesEcommCustomerChallengeResponse,
    ISalesEcommCustomerEmailInput,
    ISalesEcommCustomerInvitationCompleteInput,
    ISalesEcommCustomerOtpVerifyInput,
    ISalesEcommCustomerPasswordChangeInput,
    ISalesEcommCustomerPasswordLoginInput,
    ISalesEcommCustomerPasswordProofVerifyInput,
    ISalesEcommCustomerPasswordResetCompleteInput,
    ISalesEcommCustomerOrderListResponse,
    ISalesEcommCustomerOrderResponse,
    ISalesEcommCustomerRegistrationCompleteInput,
    ISalesEcommCustomerRegistrationVerifyInput,
    ISalesEcommCustomerResetExchangeInput,
    ISalesEcommCustomerRestrictedExchangeInput,
    ISalesEcommCustomerSession,
    ISalesEcommCustomerSessionGrantResponse,
    ISalesEcommCustomerSessionInitInput,
    ISalesEcommCustomerSessionResponse,
    ISalesEcommBuyerInput,
    ISalesEcommCartItemInput,
    ISalesEcommCartPaymentSetupResponse,
    ISalesEcommCartMembershipCardSetupResponse,
    ISalesMembershipCheckoutTerms,
    ISalesMembershipCheckoutCatalog,
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
