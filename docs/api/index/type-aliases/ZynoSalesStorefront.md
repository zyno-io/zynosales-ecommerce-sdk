# Type Alias: ZynoSalesStorefront

> **ZynoSalesStorefront** = `object`

A complete, JavaScript-only ecommerce storefront instance.

## Properties

### cart

> `readonly` **cart**: [`CartSession`](../classes/CartSession.md)

Persistent cart session with serialized mutations and render-safe snapshots.

***

### catalog

> `readonly` **catalog**: [`CatalogApi`](../classes/CatalogApi.md)

Product catalog reads with an explicit in-memory list cache.

***

### checkout

> `readonly` **checkout**: [`CheckoutCoordinator`](../classes/CheckoutCoordinator.md)

Buyer, delivery, discount, payment, and recovery workflows.

***

### client

> `readonly` **client**: [`ZynoSalesClient`](../classes/ZynoSalesClient.md)

Low-level generated Sales client for advanced integrations.

## Methods

### getConfig()

> **getConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

Cached runtime storefront configuration from Sales.

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

***

### getStripeConfiguration()

> **getStripeConfiguration**(): `Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

Stripe.js options derived from runtime configuration, or `null` when cards are unavailable.

#### Returns

`Promise`\<[`StripeBrowserConfiguration`](StripeBrowserConfiguration.md) \| `null`\>

***

### refreshConfig()

> **refreshConfig**(): `Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>

Forces a fresh configuration read from Sales.

#### Returns

`Promise`\<[`ISalesEcommStorefrontConfigResponse`](ISalesEcommStorefrontConfigResponse.md)\>
