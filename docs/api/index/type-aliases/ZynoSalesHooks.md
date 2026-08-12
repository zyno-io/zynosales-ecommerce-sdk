# Type Alias: ZynoSalesHooks

> **ZynoSalesHooks** = `object`

Defined in: src/types.ts:58

Hooks that let a host integrate server-owned policy without UI components.

## Properties

### afterOrderCompleted?

> `optional` **afterOrderCompleted?**: (`context`) => `Promise`\<`void`\> \| `void`

Defined in: src/types.ts:60

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

Defined in: src/types.ts:59

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

Defined in: src/types.ts:61

#### Parameters

##### snapshot

[`CartSnapshot`](CartSnapshot.md)

#### Returns

`void`
