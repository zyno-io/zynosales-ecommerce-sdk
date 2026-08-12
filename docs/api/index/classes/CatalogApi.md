# Class: CatalogApi

Explicit catalog reads and cache control. The current storefront API has no modifier contract yet.

## Constructors

### Constructor

> **new CatalogApi**(`client`): `CatalogApi`

#### Parameters

##### client

[`ZynoSalesClient`](ZynoSalesClient.md)

#### Returns

`CatalogApi`

## Methods

### clearCache()

> **clearCache**(): `void`

Clears the in-memory product cache.

#### Returns

`void`

***

### getProduct()

> **getProduct**(`slug`): `Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)\>

Fetches one product by slug.

#### Parameters

##### slug

`string`

#### Returns

`Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)\>

***

### getProducts()

> **getProducts**(`options?`): `Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)[]\>

Fetches products, returning the explicit cache unless `refresh` is requested.

#### Parameters

##### options?

###### refresh?

`boolean`

#### Returns

`Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)[]\>
