# Class: CheckoutCoordinator

Coordinates framework-agnostic checkout transitions for the active cart.

## Constructors

### Constructor

> **new CheckoutCoordinator**(`options`): `CheckoutCoordinator`

#### Parameters

##### options

###### cartSession

[`CartSession`](CartSession.md)

###### client

[`ZynoSalesClient`](ZynoSalesClient.md)

###### hooks

[`ZynoSalesHooks`](../type-aliases/ZynoSalesHooks.md)

###### pendingPaymentKey

`string`

###### storage

[`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

#### Returns

`CheckoutCoordinator`

## Methods

### applyDiscount()

> **applyDiscount**(`input`): `Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

Applies a discount code and returns the authoritative cart.

#### Parameters

##### input

[`ISalesEcommCartDiscountCodeInput`](../type-aliases/ISalesEcommCartDiscountCodeInput.md)

#### Returns

`Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

***

### beginCardPayment()

> **beginCardPayment**(): `Promise`\<[`ISalesEcommCartPaymentSetupResponse`](../type-aliases/ISalesEcommCartPaymentSetupResponse.md) \| `null`\>

Runs the final policy hook and opens a card-payment attempt.
For a zero-due cart it finalizes the order and returns `null`.

#### Returns

`Promise`\<[`ISalesEcommCartPaymentSetupResponse`](../type-aliases/ISalesEcommCartPaymentSetupResponse.md) \| `null`\>

***

### cancelPaymentAttempt()

> **cancelPaymentAttempt**(`attemptId`): `Promise`\<`void`\>

Cancels an unneeded payment attempt.

#### Parameters

##### attemptId

`string`

#### Returns

`Promise`\<`void`\>

***

### completeCardPayment()

> **completeCardPayment**(`input`): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

Records an authorized Stripe PaymentIntent with Sales.

#### Parameters

##### input

`Pick`\<[`CardPaymentSetup`](../type-aliases/CardPaymentSetup.md), `"paymentAttemptId"` \| `"paymentIntentId"`\>

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

***

### getOrder()

> **getOrder**(): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

Reads the completed order using the retained order capability.

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md)\>

***

### getPaymentAttempt()

> **getPaymentAttempt**(`attemptId`): `Promise`\<[`ISalesEcommPaymentAttemptResponse`](../type-aliases/ISalesEcommPaymentAttemptResponse.md)\>

Reads one payment attempt for host-managed payment UI/recovery.

#### Parameters

##### attemptId

`string`

#### Returns

`Promise`\<[`ISalesEcommPaymentAttemptResponse`](../type-aliases/ISalesEcommPaymentAttemptResponse.md)\>

***

### getShippingRates()

> **getShippingRates**(`input`): `Promise`\<[`ISalesEcommShippingRatesResponse`](../type-aliases/ISalesEcommShippingRatesResponse.md)\>

Requests backend-authoritative shipping rates.

#### Parameters

##### input

[`ISalesEcommCartShippingRatesInput`](../type-aliases/ISalesEcommCartShippingRatesInput.md)

#### Returns

`Promise`\<[`ISalesEcommShippingRatesResponse`](../type-aliases/ISalesEcommShippingRatesResponse.md)\>

***

### getSnapshot()

> **getSnapshot**(): [`CheckoutSnapshot`](../type-aliases/CheckoutSnapshot.md)

Returns the latest render-safe checkout snapshot.

#### Returns

[`CheckoutSnapshot`](../type-aliases/CheckoutSnapshot.md)

***

### quoteShippingSelection()

> **quoteShippingSelection**(`input`): `Promise`\<[`ISalesEcommShippingSelectionQuoteResponse`](../type-aliases/ISalesEcommShippingSelectionQuoteResponse.md)\>

Quotes a complete package-rate selection with backend-authoritative pricing.

#### Parameters

##### input

[`ISalesEcommShippingSelectionQuoteInput`](../type-aliases/ISalesEcommShippingSelectionQuoteInput.md)

#### Returns

`Promise`\<[`ISalesEcommShippingSelectionQuoteResponse`](../type-aliases/ISalesEcommShippingSelectionQuoteResponse.md)\>

***

### recoverPayment()

> **recoverPayment**(): `Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md) \| `null`\>

Recovers a paid order or a previously authorized payment attempt after a reload.

#### Returns

`Promise`\<[`ISalesEcommOrderResponse`](../type-aliases/ISalesEcommOrderResponse.md) \| `null`\>

***

### removeDiscount()

> **removeDiscount**(): `Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

Removes the active discount and returns the authoritative cart.

#### Returns

`Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

***

### removeFulfillment()

> **removeFulfillment**(): `Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

Removes fulfillment from the active cart.

#### Returns

`Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

***

### setBuyer()

> **setBuyer**(`input`): `Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

Updates buyer identity on the active cart.

#### Parameters

##### input

[`ISalesEcommBuyerInput`](../type-aliases/ISalesEcommBuyerInput.md)

#### Returns

`Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

***

### setFulfillment()

> **setFulfillment**(`input`): `Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

Applies fulfillment details and selected shipping rates to the active cart.

#### Parameters

##### input

[`ISalesEcommCartFulfillmentInput`](../type-aliases/ISalesEcommCartFulfillmentInput.md)

#### Returns

`Promise`\<[`ISalesEcommPublicCart`](../type-aliases/ISalesEcommPublicCart.md)\>

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Subscribes to render-safe checkout changes.

#### Parameters

##### listener

(`snapshot`) => `void`

#### Returns

() => `void`

***

### validateDiscount()

> **validateDiscount**(`code`): `Promise`\<[`IValidateDiscountCodeResponse`](../type-aliases/IValidateDiscountCodeResponse.md)\>

Validates a discount code without changing the cart.

#### Parameters

##### code

`string`

#### Returns

`Promise`\<[`IValidateDiscountCodeResponse`](../type-aliases/IValidateDiscountCodeResponse.md)\>

***

### verifyAddress()

> **verifyAddress**(`input`): `Promise`\<[`ISalesFulfillmentAddressVerificationResponse`](../type-aliases/ISalesFulfillmentAddressVerificationResponse.md)\>

Verifies an address without silently choosing a normalization candidate.

#### Parameters

##### input

[`ISalesEcommAddressVerificationInput`](../type-aliases/ISalesEcommAddressVerificationInput.md)

#### Returns

`Promise`\<[`ISalesFulfillmentAddressVerificationResponse`](../type-aliases/ISalesFulfillmentAddressVerificationResponse.md)\>
