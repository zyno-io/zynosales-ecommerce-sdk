# Class: CustomerAuth

Sign customers in, remember their sessions, and connect account checkout and order history.

## Constructors

### Constructor

> **new CustomerAuth**(`options`): `CustomerAuth`

#### Parameters

##### options

###### apiBase

`string`

###### cart

[`CartSession`](CartSession.md)

###### checkout

[`CheckoutCoordinator`](CheckoutCoordinator.md)

###### client

[`ZynoSalesClient`](ZynoSalesClient.md)

###### config

() => `Promise`\<[`ISalesEcommStorefrontConfigResponse`](../type-aliases/ISalesEcommStorefrontConfigResponse.md)\>

###### configuredOptions?

[`ISalesEcommCustomerAuthOptions`](../type-aliases/ISalesEcommCustomerAuthOptions.md)

###### namespace

`string`

###### publishableKey

`string`

###### restrictedStorage?

[`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

###### storage

[`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

###### storageKey

`string`

###### storageMode

`BrowserStorageMode`

#### Returns

`CustomerAuth`

## Methods

### bindCart()

> **bindCart**(): `Promise`\<`void`\>

Binds the authenticated contact to the active cart without clearing payment recovery state.

#### Returns

`Promise`\<`void`\>

***

### completeInvitation()

> **completeInvitation**(`input?`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Completes an approved invitation. It does not sign the customer in.

#### Parameters

##### input?

###### password?

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### completeLoginEmail()

> **completeLoginEmail**(): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Completes the verified login-email replacement and requires ordinary login afterward.

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### completePasswordReset()

> **completePasswordReset**(`newPassword`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Completes an email-link password reset and clears the consumed restricted session.

#### Parameters

##### newPassword

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### completeRegistration()

> **completeRegistration**(`input`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Verifies a registration code and completes the proof-bound enrollment in one SDK call.

#### Parameters

##### input

###### challengeId

`string`

###### code

`string`

###### name

`string`

###### password?

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### exchangeEnrollment()

> **exchangeEnrollment**(`token`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Exchanges an invitation token into a restricted tab-scoped enrollment session.

#### Parameters

##### token

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### exchangeLoginEmail()

> **exchangeLoginEmail**(`token`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Exchanges a login-email verification token into a restricted tab-scoped session.

#### Parameters

##### token

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### exchangePasswordReset()

> **exchangePasswordReset**(`token`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Exchanges an emailed recovery token into a restricted, tab-scoped proof session.

#### Parameters

##### token

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### getOrder()

> **getOrder**(`orderId`): `Promise`\<[`ISalesEcommCustomerOrderResponse`](../type-aliases/ISalesEcommCustomerOrderResponse.md)\>

Reads one payer-owned customer order without an order capability key.

#### Parameters

##### orderId

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerOrderResponse`](../type-aliases/ISalesEcommCustomerOrderResponse.md)\>

***

### getOrders()

> **getOrders**(`query?`): `Promise`\<[`ISalesEcommCustomerOrderListResponse`](../type-aliases/ISalesEcommCustomerOrderListResponse.md)\>

Lists payer-owned customer orders using the active verified customer session.

#### Parameters

##### query?

###### cursor?

`string`

###### limit?

`number`

#### Returns

`Promise`\<[`ISalesEcommCustomerOrderListResponse`](../type-aliases/ISalesEcommCustomerOrderListResponse.md)\>

***

### getSnapshot()

> **getSnapshot**(): [`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)

Returns customer state for your UI, without passwords, session tokens, or personal details.

#### Returns

[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)

***

### initialize()

> **initialize**(`options?`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Starts a customer session using the flows this storefront enables. The browser saves it locally by default.

#### Parameters

##### options?

[`ISalesEcommCustomerAuthOptions`](../type-aliases/ISalesEcommCustomerAuthOptions.md) \| `undefined`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### logout()

> **logout**(): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Signs out in this tab, clears its account cart, and asks Sales to revoke the session.

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### passwordLogin()

> **passwordLogin**(`input`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Starts password login. The request is never automatically retried.

#### Parameters

##### input

###### email

`string`

###### password

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### replacePassword()

> **replacePassword**(`input`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Changes a password with the current password or a previously verified mailbox proof.

#### Parameters

##### input

###### currentPassword?

`string`

###### newPassword

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### requestOtp()

> **requestOtp**(`email`): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

Requests an email one-time code for login.

#### Parameters

##### email

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### requestPasswordProof()

> **requestPasswordProof**(): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

Requests a mailbox proof for a password change that omits the current password.

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### requestPasswordReset()

> **requestPasswordReset**(`email`): `Promise`\<\{ `accepted`: `true`; \}\>

Requests an email recovery link using the current anonymous or authenticated session.

#### Parameters

##### email

`string`

#### Returns

`Promise`\<\{ `accepted`: `true`; \}\>

***

### requestRegistration()

> **requestRegistration**(`email`): `Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

Requests a registration verification code without submitting a password or profile data.

#### Parameters

##### email

`string`

#### Returns

`Promise`\<[`ISalesEcommCustomerChallengeResponse`](../type-aliases/ISalesEcommCustomerChallengeResponse.md)\>

***

### restore()

> **restore**(): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Checks a saved session with Sales before returning its state; local data alone never restores sign-in.

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### resumeCart()

> **resumeCart**(): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Explicitly creates a restricted session to authenticate for the active account cart.

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Keeps your account menu and forms up to date as customer state changes.

#### Parameters

##### listener

(`snapshot`) => `void`

#### Returns

() => `void`

***

### verifyOtp()

> **verifyOtp**(`input`): `Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

Verifies a login code and rotates the anonymous session secret.

#### Parameters

##### input

###### challengeId

`string`

###### code

`string`

#### Returns

`Promise`\<[`CustomerSnapshot`](../type-aliases/CustomerSnapshot.md)\>

***

### verifyPasswordProof()

> **verifyPasswordProof**(`input`): `Promise`\<`void`\>

Verifies the mailbox code for the current password-change session.

#### Parameters

##### input

###### challengeId

`string`

###### code

`string`

#### Returns

`Promise`\<`void`\>
