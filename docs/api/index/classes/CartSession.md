# Class: CartSession

Persistent, serialized cart state for one storefront instance.

## Constructors

### Constructor

> **new CartSession**(`options`): `CartSession`

#### Parameters

##### options

###### client

[`ZynoSalesClient`](ZynoSalesClient.md)

###### storage

[`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

###### storageKey

`string`

#### Returns

`CartSession`

## Methods

### abandon()

> **abandon**(): `Promise`\<`void`\>

Abandons the current cart and removes its local capability.

#### Returns

`Promise`\<`void`\>

***

### add()

> **add**(`item`): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Adds a product to the cart, merging the same product/notes combination when possible.

#### Parameters

##### item

[`ISalesEcommCartItemInput`](../type-aliases/ISalesEcommCartItemInput.md)

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### clear()

> **clear**(): `void`

Clears local cart state without issuing an API call.

#### Returns

`void`

***

### getSnapshot()

> **getSnapshot**(): [`CartSnapshot`](../type-aliases/CartSnapshot.md)

Returns the latest render-safe cart snapshot.

#### Returns

[`CartSnapshot`](../type-aliases/CartSnapshot.md)

***

### refresh()

> **refresh**(): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Reads the cart from Sales without creating a new cart.

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### remove()

> **remove**(`input`): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Removes an existing server cart item.

#### Parameters

##### input

###### cartItemId

`string`

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### restore()

> **restore**(): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Restores the persisted cart, clearing it when its capability is stale.

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### setItems()

> **setItems**(`items`): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Replaces all cart line inputs. An empty list abandons the open cart.

#### Parameters

##### items

[`ISalesEcommCartItemInput`](../type-aliases/ISalesEcommCartItemInput.md)[]

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### setQuantity()

> **setQuantity**(`input`): `Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

Updates an existing server cart item's quantity. A zero quantity removes it.

#### Parameters

##### input

###### cartItemId

`string`

###### qty

`number`

#### Returns

`Promise`\<[`CartSnapshot`](../type-aliases/CartSnapshot.md)\>

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Subscribes to render-safe cart changes. Capability values are never included.

#### Parameters

##### listener

(`snapshot`) => `void`

#### Returns

() => `void`

***

### withServerAccess()

> **withServerAccess**\<`T`\>(`callback`): `Promise`\<`T`\>

Runs a same-origin server handoff with the current cart capability.

#### Type Parameters

##### T

`T`

#### Parameters

##### callback

(`access`) => `T` \| `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
