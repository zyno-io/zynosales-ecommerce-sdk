import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const expectedOperationIds = [
    'getSalesEcommStorefrontConfigEmbeddedGet',
    'getSalesEcommProductsEmbeddedIndex',
    'getSalesEcommProductsEmbeddedShow',
    'postSalesEcommCheckoutEmbeddedCreateCart',
    'getSalesEcommCheckoutEmbeddedGetCart',
    'deleteSalesEcommCheckoutEmbeddedAbandonCart',
    'putSalesEcommCheckoutEmbeddedReplaceItems',
    'putSalesEcommCheckoutEmbeddedUpdateBuyer',
    'postSalesEcommCheckoutEmbeddedVerifyAddress',
    'postSalesEcommCheckoutEmbeddedCalculateShippingRates',
    'postSalesEcommCheckoutEmbeddedQuoteShippingSelection',
    'putSalesEcommCheckoutEmbeddedUpdateFulfillment',
    'deleteSalesEcommCheckoutEmbeddedRemoveFulfillment',
    'postSalesDiscountCodesEmbeddedValidate',
    'postSalesEcommCheckoutEmbeddedApplyDiscountCode',
    'deleteSalesEcommCheckoutEmbeddedRemoveDiscountCode',
    'postSalesEcommCheckoutEmbeddedSetupCardPayment',
    'getSalesEcommCheckoutEmbeddedGetPaymentAttempt',
    'deleteSalesEcommCheckoutEmbeddedCancelPaymentAttempt',
    'postSalesEcommCheckoutEmbeddedConfirmCardPayment',
    'postSalesEcommCheckoutEmbeddedFinalizeZeroDueCart',
    'getSalesEcommOrdersEmbeddedGet',
    'putSalesEcommCheckoutEmbeddedAcceptMembershipTerms',
    'postSalesEcommCheckoutEmbeddedSetupMembershipCard',
    'postSalesEcommCheckoutEmbeddedConfirmMembershipCard',
    'postSalesEcommCustomerAuthEmbeddedInitialize',
    'postSalesEcommCustomerAuthEmbeddedResumeCart',
    'getSalesEcommCustomerAuthEmbeddedCurrent',
    'deleteSalesEcommCustomerAuthEmbeddedLogout',
    'postSalesEcommCustomerAuthEmbeddedPasswordLogin',
    'postSalesEcommCustomerAuthEmbeddedRequestOtp',
    'postSalesEcommCustomerAuthEmbeddedVerifyOtp',
    'postSalesEcommCustomerAuthEmbeddedRequestRegistration',
    'postSalesEcommCustomerAuthEmbeddedVerifyRegistration',
    'postSalesEcommCustomerAuthEmbeddedCompleteRegistration',
    'postSalesEcommCustomerAuthEmbeddedRequestPasswordReset',
    'postSalesEcommCustomerAuthEmbeddedExchangePasswordReset',
    'putSalesEcommCustomerAuthEmbeddedCompletePasswordReset',
    'postSalesEcommCustomerAuthEmbeddedRequestPasswordProof',
    'postSalesEcommCustomerAuthEmbeddedVerifyPasswordProof',
    'putSalesEcommCustomerAuthEmbeddedReplacePassword',
    'postSalesEcommCustomerAuthEmbeddedExchangeEnrollment',
    'postSalesEcommCustomerAuthEmbeddedCompleteInvitation',
    'postSalesEcommCustomerAuthEmbeddedExchangeLoginEmail',
    'putSalesEcommCustomerAuthEmbeddedCompleteLoginEmail',
    'putSalesEcommCustomerAuthEmbeddedBindCart',
    'getSalesEcommCustomerAuthEmbeddedCustomerOrders',
    'getSalesEcommCustomerAuthEmbeddedCustomerOrder'
];

describe('filtered OpenAPI contract', () => {
    it('contains only the embedded storefront operation allowlist', async () => {
        const source = await readFile(new URL('../openapi.sales.yaml', import.meta.url), 'utf8');
        const operationIds = [...source.matchAll(/^\s+operationId: (\S+)$/gm)].map(match => match[1]);

        expect(operationIds.sort()).toEqual([...expectedOperationIds].sort());
        expect(source).not.toContain('optionsSales');
    });
});
