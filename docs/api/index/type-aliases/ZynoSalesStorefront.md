# Type Alias: ZynoSalesStorefront

> **ZynoSalesStorefront** = `object`

Defined in: src/storefront.ts:26

A complete, JavaScript-only ecommerce storefront instance.

## Properties

### cart

> `readonly` **cart**: [`CartSession`](../classes/CartSession.md)

Defined in: src/storefront.ts:29

***

### catalog

> `readonly` **catalog**: [`CatalogApi`](../classes/CatalogApi.md)

Defined in: src/storefront.ts:28

***

### checkout

> `readonly` **checkout**: [`CheckoutCoordinator`](../classes/CheckoutCoordinator.md)

Defined in: src/storefront.ts:30

***

### client

> `readonly` **client**: [`ZynoSalesClient`](../classes/ZynoSalesClient.md)

Defined in: src/storefront.ts:27

## Methods

### getConfig()

> **getConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

Defined in: src/storefront.ts:31

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

***

### getStripeConfiguration()

> **getStripeConfiguration**(): `Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

Defined in: src/storefront.ts:33

#### Returns

`Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

***

### refreshConfig()

> **refreshConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

Defined in: src/storefront.ts:32

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>
