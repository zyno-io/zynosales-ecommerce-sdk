# Type Alias: ZynoSalesHooks

> **ZynoSalesHooks** = `object`

Hooks that let a host integrate server-owned policy without UI components.

## Properties

### afterOrderCompleted?

> `optional` **afterOrderCompleted?**: (`context`) => `Promise`\<`void`\> \| `void`

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

#### Parameters

##### snapshot

[`CartSnapshot`](CartSnapshot.md)

#### Returns

`void`
