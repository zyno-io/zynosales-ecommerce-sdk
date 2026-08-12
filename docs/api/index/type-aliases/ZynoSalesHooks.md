# Type Alias: ZynoSalesHooks

> **ZynoSalesHooks** = `object`

Hooks that let a host integrate server-owned policy without UI components.

## Properties

### afterOrderCompleted?

> `optional` **afterOrderCompleted?**: (`context`) => `Promise`\<`void`\> \| `void`

Runs once after Sales returns a paid order from confirmation, zero-due
finalization, or recovery. Failures are swallowed by the SDK.

#### Parameters

##### context

###### cartId

`string`

###### order

[`Order`](Order.md)

#### Returns

`Promise`\<`void`\> \| `void`

***

### beforePayment?

> `optional` **beforePayment?**: (`context`) => `Promise`\<`void`\> \| `void`

Runs before a new payment setup. Throw/reject to block payment.
Not rerun when recovering the same persisted setup.

#### Parameters

##### context

###### cart

[`Cart`](Cart.md)

###### cartAccess

[`CartServerAccess`](CartServerAccess.md)

#### Returns

`Promise`\<`void`\> \| `void`

***

### onCartChanged?

> `optional` **onCartChanged?**: (`snapshot`) => `void`

Application-wide cart snapshot listener; equivalent to `cart.subscribe` without unsubscribe.

#### Parameters

##### snapshot

[`CartSnapshot`](CartSnapshot.md)

#### Returns

`void`
