# Class: CatalogApi

Defined in: src/catalog.ts:6

Explicit catalog reads and cache control. The current storefront API has no modifier contract yet.

## Constructors

### Constructor

> **new CatalogApi**(`client`): `CatalogApi`

Defined in: src/catalog.ts:10

#### Parameters

##### client

[`ZynoSalesClient`](ZynoSalesClient.md)

#### Returns

`CatalogApi`

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: src/catalog.ts:29

Clears the in-memory product cache.

#### Returns

`void`

***

### getProduct()

> **getProduct**(`slug`): `Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)\>

Defined in: src/catalog.ts:23

Fetches one product by slug.

#### Parameters

##### slug

`string`

#### Returns

`Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)\>

***

### getProducts()

> **getProducts**(`options?`): `Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)[]\>

Defined in: src/catalog.ts:15

Fetches products, returning the explicit cache unless `refresh` is requested.

#### Parameters

##### options?

###### refresh?

`boolean`

#### Returns

`Promise`\<[`StoreProduct`](../type-aliases/StoreProduct.md)[]\>
