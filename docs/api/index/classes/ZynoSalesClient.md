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

### createCart()

> **createCart**(`input`): `Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

#### Parameters

##### input

[`ISalesEcommCartCreateInput`](../../generated/sales/type-aliases/ISalesEcommCartCreateInput.md)

#### Returns

`Promise`\<[`ISalesEcommCartResponse`](../type-aliases/ISalesEcommCartResponse.md)\>

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
