# Type Alias: ZynoSalesStorefront

> **ZynoSalesStorefront** = `object`

A complete, JavaScript-only ecommerce storefront instance.

## Properties

### cart

> `readonly` **cart**: [`CartSession`](../classes/CartSession.md)

***

### catalog

> `readonly` **catalog**: [`CatalogApi`](../classes/CatalogApi.md)

***

### checkout

> `readonly` **checkout**: [`CheckoutCoordinator`](../classes/CheckoutCoordinator.md)

***

### client

> `readonly` **client**: [`ZynoSalesClient`](../classes/ZynoSalesClient.md)

## Methods

### getConfig()

> **getConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

***

### getStripeConfiguration()

> **getStripeConfiguration**(): `Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

#### Returns

`Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

***

### refreshConfig()

> **refreshConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>
