import { createClient } from './generated/sales/client';
import {
    SalesSalesDiscountCodesEmbeddedApi,
    SalesSalesEcommCheckoutEmbeddedApi,
    SalesSalesEcommOrdersEmbeddedApi,
    SalesSalesEcommProductsEmbeddedApi,
    SalesSalesEcommStorefrontConfigEmbeddedApi
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
    ISalesFulfillmentAddressVerificationResponse,
    IValidateDiscountCodeRequest,
    IValidateDiscountCodeResponse
} from './generated/sales';
import { toZynoSalesError } from './errors';

/** Low-level generated-contract client. It does not persist cart capabilities. */
export class ZynoSalesClient {
    private readonly client;
    private readonly publishableKey: string;

    public constructor(options: { apiBase: string; publishableKey: string; fetch?: typeof fetch }) {
        if (!options.publishableKey) throw new Error('A ZynoSales publishableKey is required.');

        this.publishableKey = options.publishableKey;
        this.client = createClient({
            baseUrl: options.apiBase,
            headers: this.publicHeaders(),
            ...(options.fetch ? { fetch: options.fetch } : {})
        });

        this.client.interceptors.error.use((error, response) => toZynoSalesError(error, response?.status));
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

    private publicHeaders() {
        return { 'x-zs-publishable-key': this.publishableKey } as const;
    }

    private cartHeaders(cartKey: string) {
        return { 'x-zs-publishable-key': this.publishableKey, 'x-zs-cart-key': cartKey } as const;
    }

    private orderHeaders(orderKey: string) {
        return { 'x-zs-publishable-key': this.publishableKey, 'x-zs-order-key': orderKey } as const;
    }
}

async function unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
    const result = await request;
    return result.data;
}
