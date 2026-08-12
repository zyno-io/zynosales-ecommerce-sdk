# Type Alias: ZynoSalesSharedOptions

> **ZynoSalesSharedOptions** = `object`

Common storefront configuration shared by environment and explicit-base setup.

## Properties

### fetch?

> `optional` **fetch?**: *typeof* `fetch`

Custom fetch implementation for tests or non-browser hosts. Defaults to global `fetch`.

***

### hooks?

> `optional` **hooks?**: [`ZynoSalesHooks`](ZynoSalesHooks.md)

Lifecycle callbacks for cart changes, payment policy, and completed orders.

***

### publishableKey

> **publishableKey**: `string`

Storefront publishable key (`zs_pk_...`). Safe to embed in browser bundles.

***

### sessionStorage?

> `optional` **sessionStorage?**: [`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

Session storage for payment recovery markers. Defaults to `sessionStorage` in browsers.

***

### storage?

> `optional` **storage?**: [`ZynoSalesStorage`](../interfaces/ZynoSalesStorage.md)

Persistent storage for cart/order capabilities. Defaults to `localStorage` in browsers.
