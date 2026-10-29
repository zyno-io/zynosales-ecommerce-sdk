import { createClient } from './generated/sales/client';
import {
    SalesSalesDiscountCodesEmbeddedApi,
    SalesSalesEcommCheckoutEmbeddedApi,
    SalesSalesEcommOrdersEmbeddedApi,
    SalesSalesEcommProductsEmbeddedApi,
    SalesSalesEcommStorefrontConfigEmbeddedApi,
    SalesSalesEcommCustomerAuthEmbeddedApi
} from './generated/sales';
import type {
    ISalesEcommAddressVerificationInput,
    ISalesEcommBuyerInput,
    ISalesEcommCartConfirmPaymentInput,
    ISalesEcommCartCreateInput,
    ISalesEcommCartDiscountCodeInput,
    ISalesEcommCartFulfillmentInput,
    ISalesEcommCartPaymentSetupInput,
    ISalesEcommCartResponse,
    ISalesEcommCartShippingRatesInput,
    ISalesEcommCartUpdateItemsInput,
    ISalesEcommOrderResponse,
    ISalesEcommPaymentAttemptResponse,
    ISalesEcommShippingRatesResponse,
    ISalesEcommShippingSelectionQuoteInput,
    ISalesEcommShippingSelectionQuoteResponse,
    ISalesEcommStoreProduct,
    ISalesEcommStorefrontConfigResponse,
    ISalesEcommCustomerAuthOptions,
    ISalesEcommCustomerSessionGrantResponse,
    ISalesEcommCustomerSessionResponse,
    ISalesEcommCustomerPasswordLoginInput,
    ISalesEcommCustomerEmailInput,
    ISalesEcommCustomerOtpVerifyInput,
    ISalesEcommCustomerRegistrationVerifyInput,
    ISalesEcommCustomerChallengeResponse,
    ISalesEcommCustomerRegistrationCompleteInput,
    ISalesEcommCustomerProofResponse,
    ISalesEcommCustomerResetExchangeInput,
    ISalesEcommCustomerPasswordResetCompleteInput,
    ISalesEcommCustomerPasswordProofVerifyInput,
    ISalesEcommCustomerPasswordChangeInput,
    ISalesEcommCustomerRestrictedExchangeInput,
    ISalesEcommCustomerInvitationCompleteInput,
    ISalesEcommCustomerOrderListResponse,
    ISalesEcommCustomerOrderResponse,
    ISalesFulfillmentAddressVerificationResponse,
    IValidateDiscountCodeRequest,
    IValidateDiscountCodeResponse
} from './generated/sales';
import { toZynoSalesError, ZynoSalesError } from './errors';

/** Low-level generated-contract client. It does not persist cart capabilities. */
export class ZynoSalesClient {
    private readonly client;
    private readonly publishableKey: string;
    private customerSessionSecret: string | null = null;
    private customerSessionInvalidListener?: (error: ZynoSalesError) => void;

    public constructor(options: { apiBase: string; publishableKey: string; fetch?: typeof fetch }) {
        if (!options.publishableKey) throw new Error('A ZynoSales publishableKey is required.');

        this.publishableKey = options.publishableKey;
        this.client = createClient({
            baseUrl: options.apiBase,
            headers: this.publicHeaders(),
            ...(options.fetch ? { fetch: options.fetch } : {})
        });

        this.client.interceptors.error.use((error, response) => {
            const normalized = toZynoSalesError(error, response?.status);
            if (normalized.code === 'REAUTHENTICATION_REQUIRED'
                || normalized.code === 'AUTH_POLICY_MISMATCH'
                || normalized.code === 'STOREFRONT_CONFIG_CHANGED') {
                this.customerSessionInvalidListener?.(normalized);
            }
            return normalized;
        });
    }

    /** @internal Installs the opaque customer capability for protected Sales operations. */
    public setCustomerSessionSecret(secret: string | null): void {
        this.customerSessionSecret = secret;
    }

    /** @internal Clears SDK customer state when a protected request rejects its session. */
    public setCustomerSessionInvalidListener(listener: ((error: ZynoSalesError) => void) | undefined): void {
        this.customerSessionInvalidListener = listener;
    }

    public getConfig(): Promise<ISalesEcommStorefrontConfigResponse> {
        return unwrap(SalesSalesEcommStorefrontConfigEmbeddedApi.getSalesEcommStorefrontConfigEmbeddedGet({
            client: this.client,
            headers: this.publicHeaders(),
            throwOnError: true
        }));
    }

    public getProducts(): Promise<ISalesEcommStoreProduct[]> {
        return unwrap(SalesSalesEcommProductsEmbeddedApi.getSalesEcommProductsEmbeddedIndex({
            client: this.client,
            headers: this.publicHeaders(),
            throwOnError: true
        }));
    }

    public getProduct(slug: string): Promise<ISalesEcommStoreProduct> {
        return unwrap(SalesSalesEcommProductsEmbeddedApi.getSalesEcommProductsEmbeddedShow({
            client: this.client,
            path: { slug },
            headers: this.publicHeaders(),
            throwOnError: true
        }));
    }

    public createCart(input: ISalesEcommCartCreateInput): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedCreateCart({
            client: this.client,
            headers: this.publicHeaders(),
            body: input,
            throwOnError: true
        }));
    }

    public getCart(cartId: string, cartKey: string): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.getSalesEcommCheckoutEmbeddedGetCart({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        }));
    }

    public abandonCart(cartId: string, cartKey: string): Promise<void> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.deleteSalesEcommCheckoutEmbeddedAbandonCart({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        })).then(() => undefined);
    }

    public replaceItems(cartId: string, cartKey: string, input: ISalesEcommCartUpdateItemsInput): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.putSalesEcommCheckoutEmbeddedReplaceItems({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public updateBuyer(cartId: string, cartKey: string, input: ISalesEcommBuyerInput): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.putSalesEcommCheckoutEmbeddedUpdateBuyer({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public acceptMembershipTerms(cartId: string, cartKey: string, input: { termsHash: string }): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.putSalesEcommCheckoutEmbeddedAcceptMembershipTerms({
            client: this.client, path: { cartId }, headers: this.cartHeaders(cartKey), body: input, throwOnError: true
        }));
    }

    public setupMembershipCard(cartId: string, cartKey: string, input: ISalesEcommCartPaymentSetupInput) {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedSetupMembershipCard({
            client: this.client, path: { cartId }, headers: this.cartHeaders(cartKey), body: input, throwOnError: true
        }));
    }

    public confirmMembershipCard(cartId: string, cartKey: string, input: { paymentAttemptId: string; setupIntentId: string }): Promise<ISalesEcommOrderResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedConfirmMembershipCard({
            client: this.client, path: { cartId }, headers: this.cartHeaders(cartKey), body: input, throwOnError: true
        }));
    }

    public verifyAddress(cartId: string, cartKey: string, input: ISalesEcommAddressVerificationInput): Promise<ISalesFulfillmentAddressVerificationResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedVerifyAddress({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public calculateShippingRates(cartId: string, cartKey: string, input: ISalesEcommCartShippingRatesInput): Promise<ISalesEcommShippingRatesResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedCalculateShippingRates({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public quoteShippingSelection(cartId: string, cartKey: string, input: ISalesEcommShippingSelectionQuoteInput): Promise<ISalesEcommShippingSelectionQuoteResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedQuoteShippingSelection({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public updateFulfillment(cartId: string, cartKey: string, input: ISalesEcommCartFulfillmentInput): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.putSalesEcommCheckoutEmbeddedUpdateFulfillment({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public removeFulfillment(cartId: string, cartKey: string): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.deleteSalesEcommCheckoutEmbeddedRemoveFulfillment({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        }));
    }

    public validateDiscount(cartId: string, cartKey: string, code: string): Promise<IValidateDiscountCodeResponse> {
        const input: IValidateDiscountCodeRequest = { code, tabId: cartId };
        return unwrap(SalesSalesDiscountCodesEmbeddedApi.postSalesDiscountCodesEmbeddedValidate({
            client: this.client,
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public applyDiscount(cartId: string, cartKey: string, input: ISalesEcommCartDiscountCodeInput): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedApplyDiscountCode({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public removeDiscount(cartId: string, cartKey: string): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.deleteSalesEcommCheckoutEmbeddedRemoveDiscountCode({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        }));
    }

    public setupCardPayment(cartId: string, cartKey: string, input: ISalesEcommCartPaymentSetupInput) {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedSetupCardPayment({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public getPaymentAttempt(cartId: string, cartKey: string, attemptId: string): Promise<ISalesEcommPaymentAttemptResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.getSalesEcommCheckoutEmbeddedGetPaymentAttempt({
            client: this.client,
            path: { cartId, attemptId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        }));
    }

    public cancelPaymentAttempt(cartId: string, cartKey: string, attemptId: string): Promise<void> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.deleteSalesEcommCheckoutEmbeddedCancelPaymentAttempt({
            client: this.client,
            path: { cartId, attemptId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        })).then(() => undefined);
    }

    public confirmCardPayment(cartId: string, cartKey: string, input: ISalesEcommCartConfirmPaymentInput): Promise<ISalesEcommOrderResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedConfirmCardPayment({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            body: input,
            throwOnError: true
        }));
    }

    public finalizeZeroDueCart(cartId: string, cartKey: string): Promise<ISalesEcommCartResponse> {
        return unwrap(SalesSalesEcommCheckoutEmbeddedApi.postSalesEcommCheckoutEmbeddedFinalizeZeroDueCart({
            client: this.client,
            path: { cartId },
            headers: this.cartHeaders(cartKey),
            throwOnError: true
        }));
    }

    public getOrder(orderId: string, orderKey: string): Promise<ISalesEcommOrderResponse> {
        return unwrap(SalesSalesEcommOrdersEmbeddedApi.getSalesEcommOrdersEmbeddedGet({
            client: this.client,
            path: { orderId },
            headers: this.orderHeaders(orderKey),
            throwOnError: true
        }));
    }

    public initializeCustomerSession(input: { policyId: string; policyRevision: number; options: ISalesEcommCustomerAuthOptions }): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedInitialize({
            client: this.client, headers: this.publicHeaders(), body: input, throwOnError: true
        }));
    }

    public resumeCustomerCartSession(cartId: string, cartKey: string): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedResumeCart({
            client: this.client,
            headers: { ...this.publicHeaders(), 'x-zs-cart-key': cartKey },
            body: { cartId },
            throwOnError: true
        }));
    }

    public getCustomerSession(secret: string): Promise<ISalesEcommCustomerSessionResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.getSalesEcommCustomerAuthEmbeddedCurrent({
            client: this.client, headers: this.customerHeaders(secret), throwOnError: true
        }));
    }

    public async logoutCustomerSession(secret: string): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.deleteSalesEcommCustomerAuthEmbeddedLogout({
            client: this.client, headers: this.customerHeaders(secret), throwOnError: true
        });
        void result;
    }

    public passwordLogin(secret: string, input: ISalesEcommCustomerPasswordLoginInput): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedPasswordLogin({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public requestCustomerOtp(secret: string, input: ISalesEcommCustomerEmailInput): Promise<ISalesEcommCustomerChallengeResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedRequestOtp({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public verifyCustomerOtp(secret: string, input: ISalesEcommCustomerOtpVerifyInput): Promise<{ purpose: 'login'; session: ISalesEcommCustomerSessionGrantResponse }> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedVerifyOtp({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public requestCustomerRegistration(secret: string, input: ISalesEcommCustomerEmailInput): Promise<ISalesEcommCustomerChallengeResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedRequestRegistration({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public verifyCustomerRegistration(secret: string, input: ISalesEcommCustomerRegistrationVerifyInput): Promise<ISalesEcommCustomerProofResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedVerifyRegistration({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public completeCustomerRegistration(secret: string, input: ISalesEcommCustomerRegistrationCompleteInput): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedCompleteRegistration({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public requestCustomerPasswordReset(secret: string, input: ISalesEcommCustomerEmailInput): Promise<{ accepted: true }> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedRequestPasswordReset({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        }));
    }

    public exchangeCustomerPasswordReset(input: ISalesEcommCustomerResetExchangeInput): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedExchangePasswordReset({
            client: this.client, headers: this.publicHeaders(), body: input, throwOnError: true
        }));
    }

    public async completeCustomerPasswordReset(secret: string, input: ISalesEcommCustomerPasswordResetCompleteInput): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.putSalesEcommCustomerAuthEmbeddedCompletePasswordReset({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        });
        void result;
    }

    public requestCustomerPasswordProof(secret: string): Promise<ISalesEcommCustomerChallengeResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedRequestPasswordProof({
            client: this.client, headers: this.customerHeaders(secret), throwOnError: true
        }));
    }

    public async verifyCustomerPasswordProof(secret: string, input: ISalesEcommCustomerPasswordProofVerifyInput): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedVerifyPasswordProof({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        });
        void result;
    }

    public async replaceCustomerPassword(secret: string, input: ISalesEcommCustomerPasswordChangeInput): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.putSalesEcommCustomerAuthEmbeddedReplacePassword({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        });
        void result;
    }

    public exchangeCustomerEnrollment(input: ISalesEcommCustomerRestrictedExchangeInput): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedExchangeEnrollment({
            client: this.client, headers: this.publicHeaders(), body: input, throwOnError: true
        }));
    }

    public async completeCustomerInvitation(secret: string, input: ISalesEcommCustomerInvitationCompleteInput): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedCompleteInvitation({
            client: this.client, headers: this.customerHeaders(secret), body: input, throwOnError: true
        });
        void result;
    }

    public exchangeCustomerLoginEmail(input: ISalesEcommCustomerRestrictedExchangeInput): Promise<ISalesEcommCustomerSessionGrantResponse> {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.postSalesEcommCustomerAuthEmbeddedExchangeLoginEmail({
            client: this.client, headers: this.publicHeaders(), body: input, throwOnError: true
        }));
    }

    public async completeCustomerLoginEmail(secret: string): Promise<void> {
        const result = await SalesSalesEcommCustomerAuthEmbeddedApi.putSalesEcommCustomerAuthEmbeddedCompleteLoginEmail({
            client: this.client, headers: this.customerHeaders(secret), throwOnError: true
        });
        void result;
    }

    public bindCustomerCart(cartId: string, cartKey: string, secret: string) {
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.putSalesEcommCustomerAuthEmbeddedBindCart({
            client: this.client,
            path: { cartId },
            headers: { ...this.cartHeaders(cartKey), 'x-zs-customer-session': secret },
            throwOnError: true
        }));
    }

    public getCustomerOrders(secret: string | undefined = this.customerSessionSecret ?? undefined, query?: { cursor?: string; limit?: number }): Promise<ISalesEcommCustomerOrderListResponse> {
        if (!secret) throw new ZynoSalesError('A customer session is required to read account orders.');
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.getSalesEcommCustomerAuthEmbeddedCustomerOrders({
            client: this.client, headers: this.customerHeaders(secret), query, throwOnError: true
        }));
    }

    public getCustomerOrder(orderId: string, secret: string | undefined = this.customerSessionSecret ?? undefined): Promise<ISalesEcommCustomerOrderResponse> {
        if (!secret) throw new ZynoSalesError('A customer session is required to read an account order.');
        return unwrap(SalesSalesEcommCustomerAuthEmbeddedApi.getSalesEcommCustomerAuthEmbeddedCustomerOrder({
            client: this.client, path: { orderId }, headers: this.customerHeaders(secret), throwOnError: true
        }));
    }

    private publicHeaders() {
        return { 'x-zs-publishable-key': this.publishableKey } as const;
    }

    private cartHeaders(cartKey: string) {
        return {
            'x-zs-publishable-key': this.publishableKey,
            'x-zs-cart-key': cartKey,
            ...(this.customerSessionSecret ? { 'x-zs-customer-session': this.customerSessionSecret } : {})
        } as const;
    }

    private orderHeaders(orderKey: string) {
        return { 'x-zs-publishable-key': this.publishableKey, 'x-zs-order-key': orderKey } as const;
    }

    private customerHeaders(secret: string) {
        return { 'x-zs-publishable-key': this.publishableKey, 'x-zs-customer-session': secret } as const;
    }
}

async function unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
    const result = await request;
    return result.data;
}
