# Class: ZynoSalesClient

Low-level generated-contract client. It does not persist cart capabilities.

## Constructors

### Constructor

> **new ZynoSalesClient**(`options`): `ZynoSalesClient`

#### Parameters

##### options

###### apiBase

`string`

###### fetch?

\{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

###### publishableKey

`string`

#### Returns

`ZynoSalesClient`

## Methods

### abandonCart()

> **abandonCart**(`cartId`, `cartKey`): `Promise`\<`void`\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<`void`\>

***

### acceptMembershipTerms()

> **acceptMembershipTerms**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

###### termsHash

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### applyDiscount()

> **applyDiscount**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartDiscountCodeInput`](../type-aliases/ISalesEcommCartDiscountCodeInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### bindCustomerCart()

> **bindCustomerCart**(`cartId`, `cartKey`, `secret`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### secret

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### calculateShippingRates()

> **calculateShippingRates**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommShippingRatesResponse`](../type-aliases/ISalesEcommShippingRatesResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartShippingRatesInput`](../type-aliases/ISalesEcommCartShippingRatesInput.md)

#### Returns

`Promise`\<[`ISalesEcommShippingRatesResponse`](../type-aliases/ISalesEcommShippingRatesResponse.md)\>

***

### cancelPaymentAttempt()

> **cancelPaymentAttempt**(`cartId`, `cartKey`, `attemptId`): `Promise`\<`void`\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### attemptId

`string`

#### Returns

`Promise`\<`void`\>

***

### completeCustomerInvitation()

> **completeCustomerInvitation**(`secret`, `input`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerInvitationCompleteInput`](../type-aliases/ISalesEcommCustomerInvitationCompleteInput.md)

#### Returns

`Promise`\<`void`\>

***

### completeCustomerLoginEmail()

> **completeCustomerLoginEmail**(`secret`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

#### Returns

`Promise`\<`void`\>

***

### completeCustomerPasswordReset()

> **completeCustomerPasswordReset**(`secret`, `input`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerPasswordResetCompleteInput`](../type-aliases/ISalesEcommCustomerPasswordResetCompleteInput.md)

#### Returns

`Promise`\<`void`\>

***

### completeCustomerRegistration()

> **completeCustomerRegistration**(`secret`, `input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerRegistrationCompleteInput`](../type-aliases/ISalesEcommCustomerRegistrationCompleteInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### confirmCardPayment()

> **confirmCardPayment**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartConfirmPaymentInput`](../../generated/sales/type-aliases/ISalesEcommCartConfirmPaymentInput.md)

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

***

### confirmMembershipCard()

> **confirmMembershipCard**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

###### paymentAttemptId

`string`

###### setupIntentId

`string`

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

***

### createCart()

> **createCart**(`input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### input

[`ISalesEcommCartCreateInput`](../../generated/sales/type-aliases/ISalesEcommCartCreateInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### exchangeCustomerEnrollment()

> **exchangeCustomerEnrollment**(`input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### input

[`ISalesEcommCustomerRestrictedExchangeInput`](../type-aliases/ISalesEcommCustomerRestrictedExchangeInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### exchangeCustomerLoginEmail()

> **exchangeCustomerLoginEmail**(`input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### input

[`ISalesEcommCustomerRestrictedExchangeInput`](../type-aliases/ISalesEcommCustomerRestrictedExchangeInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### exchangeCustomerPasswordReset()

> **exchangeCustomerPasswordReset**(`input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### input

[`ISalesEcommCustomerResetExchangeInput`](../type-aliases/ISalesEcommCustomerResetExchangeInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### finalizeZeroDueCart()

> **finalizeZeroDueCart**(`cartId`, `cartKey`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### getCart()

> **getCart**(`cartId`, `cartKey`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### getConfig()

> **getConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](../type-aliases/ISalesEcommStorefrontConfigResponse.md)\>

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](../type-aliases/ISalesEcommStorefrontConfigResponse.md)\>

***

### getCustomerOrder()

> **getCustomerOrder**(`orderId`, `secret?`): `Promise`\<[`ISalesEcommCustomerOrderResponse`](../type-aliases/ISalesEcommCustomerOrderResponse.md)\>

#### Parameters

##### orderId

`string`

##### secret?

`string` \| `undefined`

#### Returns

`Promise`\<[`ISalesEcommCustomerOrderResponse`](../type-aliases/ISalesEcommCustomerOrderResponse.md)\>

***

### getCustomerOrders()

> **getCustomerOrders**(`secret?`, `query?`): `Promise`\<[`ISalesEcommCustomerOrderListResponse`](../type-aliases/ISalesEcommCustomerOrderListResponse.md)\>

#### Parameters

##### secret?

`string` \| `undefined`

##### query?

###### cursor?

`string`

###### limit?

`number`

#### Returns

`Promise`\<[`ISalesEcommCustomerOrderListResponse`](../type-aliases/ISalesEcommCustomerOrderListResponse.md)\>

***

### getCustomerSession()

> **getCustomerSession**(`secret`): `Promise`\<[`ISalesEcommCustomerSessionResponse`](../type-aliases/ISalesEcommCustomerSessionResponse.md)\>

#### Parameters

##### secret

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionResponse`](../type-aliases/ISalesEcommCustomerSessionResponse.md)\>

***

### getOrder()

> **getOrder**(`orderId`, `orderKey`): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

#### Parameters

##### orderId

`string`

##### orderKey

`string`

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

***

### getPaymentAttempt()

> **getPaymentAttempt**(`cartId`, `cartKey`, `attemptId`): `Promise`\<[`ISalesEcommPaymentAttemptResponse`](../type-aliases/ISalesEcommPaymentAttemptResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### attemptId

`string`

#### Returns

`Promise`\<[`ISalesEcommPaymentAttemptResponse`](../type-aliases/ISalesEcommPaymentAttemptResponse.md)\>

***

### getProduct()

> **getProduct**(`slug`): `Promise`\<[`ISalesEcommStoreProduct`](../type-aliases/ISalesEcommStoreProduct.md)\>

#### Parameters

##### slug

`string`

#### Returns

`Promise`\<[`ISalesEcommStoreProduct`](../type-aliases/ISalesEcommStoreProduct.md)\>

***

### getProducts()

> **getProducts**(): `Promise`\<[`ISalesEcommStoreProduct`](../type-aliases/ISalesEcommStoreProduct.md)[]\>

#### Returns

`Promise`\<[`ISalesEcommStoreProduct`](../type-aliases/ISalesEcommStoreProduct.md)[]\>

***

### initializeCustomerSession()

> **initializeCustomerSession**(`input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### input

###### options

[`ISalesEcommCustomerAuthOptions`](../type-aliases/ISalesEcommCustomerAuthOptions.md)

###### policyId

`string`

###### policyRevision

`number`

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### logoutCustomerSession()

> **logoutCustomerSession**(`secret`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

#### Returns

`Promise`\<`void`\>

***

### passwordLogin()

> **passwordLogin**(`secret`, `input`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerPasswordLoginInput`](../type-aliases/ISalesEcommCustomerPasswordLoginInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### quoteShippingSelection()

> **quoteShippingSelection**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommShippingSelectionQuoteResponse`](../type-aliases/ISalesEcommShippingSelectionQuoteResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommShippingSelectionQuoteInput`](../type-aliases/ISalesEcommShippingSelectionQuoteInput.md)

#### Returns

`Promise`\<[`ISalesEcommShippingSelectionQuoteResponse`](../type-aliases/ISalesEcommShippingSelectionQuoteResponse.md)\>

***

### removeDiscount()

> **removeDiscount**(`cartId`, `cartKey`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### removeFulfillment()

> **removeFulfillment**(`cartId`, `cartKey`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### replaceCustomerPassword()

> **replaceCustomerPassword**(`secret`, `input`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerPasswordChangeInput`](../type-aliases/ISalesEcommCustomerPasswordChangeInput.md)

#### Returns

`Promise`\<`void`\>

***

### replaceItems()

> **replaceItems**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartUpdateItemsInput`](../../generated/sales/type-aliases/ISalesEcommCartUpdateItemsInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### requestCustomerOtp()

> **requestCustomerOtp**(`secret`, `input`): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerEmailInput`](../type-aliases/ISalesEcommCustomerEmailInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### requestCustomerPasswordProof()

> **requestCustomerPasswordProof**(`secret`): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

#### Parameters

##### secret

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### requestCustomerPasswordReset()

> **requestCustomerPasswordReset**(`secret`, `input`): `Promise`\<\{ `accepted`: `true`; \}\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerEmailInput`](../type-aliases/ISalesEcommCustomerEmailInput.md)

#### Returns

`Promise`\<\{ `accepted`: `true`; \}\>

***

### requestCustomerRegistration()

> **requestCustomerRegistration**(`secret`, `input`): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerEmailInput`](../type-aliases/ISalesEcommCustomerEmailInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### resumeCustomerCartSession()

> **resumeCustomerCartSession**(`cartId`, `cartKey`): `Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md)\>

***

### setupCardPayment()

> **setupCardPayment**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartPaymentSetupResponse`](../type-aliases/ISalesEcommCartPaymentSetupResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartPaymentSetupInput`](../../generated/sales/type-aliases/ISalesEcommCartPaymentSetupInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartPaymentSetupResponse`](../type-aliases/ISalesEcommCartPaymentSetupResponse.md)\>

***

### setupMembershipCard()

> **setupMembershipCard**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartMembershipCardSetupResponse`](../type-aliases/ISalesEcommCartMembershipCardSetupResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartPaymentSetupInput`](../../generated/sales/type-aliases/ISalesEcommCartPaymentSetupInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartMembershipCardSetupResponse`](../type-aliases/ISalesEcommCartMembershipCardSetupResponse.md)\>

***

### updateBuyer()

> **updateBuyer**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommBuyerInput`](../type-aliases/ISalesEcommBuyerInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### updateFulfillment()

> **updateFulfillment**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommCartFulfillmentInput`](../type-aliases/ISalesEcommCartFulfillmentInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

***

### validateDiscount()

> **validateDiscount**(`cartId`, `cartKey`, `code`): `Promise`\<[`IValidateDiscountCodeResponse`](../type-aliases/IValidateDiscountCodeResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### code

`string`

#### Returns

`Promise`\<[`IValidateDiscountCodeResponse`](../type-aliases/IValidateDiscountCodeResponse.md)\>

***

### verifyAddress()

> **verifyAddress**(`cartId`, `cartKey`, `input`): `Promise`\<[`ISalesFulfillmentAddressVerificationResponse`](../type-aliases/ISalesFulfillmentAddressVerificationResponse.md)\>

#### Parameters

##### cartId

`string`

##### cartKey

`string`

##### input

[`ISalesEcommAddressVerificationInput`](../type-aliases/ISalesEcommAddressVerificationInput.md)

#### Returns

`Promise`\<[`ISalesFulfillmentAddressVerificationResponse`](../type-aliases/ISalesFulfillmentAddressVerificationResponse.md)\>

***

### verifyCustomerOtp()

> **verifyCustomerOtp**(`secret`, `input`): `Promise`\<\{ `purpose`: `"login"`; `session`: [`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md); \}\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerOtpVerifyInput`](../type-aliases/ISalesEcommCustomerOtpVerifyInput.md)

#### Returns

`Promise`\<\{ `purpose`: `"login"`; `session`: [`ISalesEcommCustomerSessionGrantResponse`](../type-aliases/ISalesEcommCustomerSessionGrantResponse.md); \}\>

***

### verifyCustomerPasswordProof()

> **verifyCustomerPasswordProof**(`secret`, `input`): `Promise`\<`void`\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerPasswordProofVerifyInput`](../type-aliases/ISalesEcommCustomerPasswordProofVerifyInput.md)

#### Returns

`Promise`\<`void`\>

***

### verifyCustomerRegistration()

> **verifyCustomerRegistration**(`secret`, `input`): `Promise`\<[`ISalesEcommCustomerProofResponse`](../../generated/sales/type-aliases/ISalesEcommCustomerProofResponse.md)\>

#### Parameters

##### secret

`string`

##### input

[`ISalesEcommCustomerRegistrationVerifyInput`](../type-aliases/ISalesEcommCustomerRegistrationVerifyInput.md)

#### Returns

`Promise`\<[`ISalesEcommCustomerProofResponse`](../../generated/sales/type-aliases/ISalesEcommCustomerProofResponse.md)\>
