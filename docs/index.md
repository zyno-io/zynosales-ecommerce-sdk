---
layout: home
hero:
  name: ZynoSales eCommerce SDK
  text: Build a complete storefront in your own UI
  tagline: Load products, persist carts, quote delivery, apply discounts, and complete payments with Sales-authoritative state.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: Build a cart
      link: /guide/cart
    - theme: alt
      text: API reference
      link: /api/
features:
  - title: Framework-neutral
    details: Use the same TypeScript APIs from Vue, React, Svelte, server-rendered pages, or plain browser JavaScript.
  - title: Server-authoritative commerce
    details: Render catalog, tax, discount, shipping, and order totals returned by ZynoSales instead of reproducing pricing rules in the browser.
  - title: Persistent cart and recovery
    details: Restore cart capabilities after reloads and recover interrupted card-payment attempts without exposing secrets in render state.
  - title: Your checkout experience
    details: The SDK supplies workflows and safe snapshots while your application owns components, routing, validation messages, and styling.
---

## One SDK, the whole storefront workflow

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: 'zs_pk_...'
});

const products = await storefront.catalog.getProducts();
await storefront.cart.restore();

const firstProduct = products[0];
if (firstProduct) {
    await storefront.cart.add({ productId: firstProduct.id, qty: 1 });
}
```

Continue with [products](./guide/products), [cart management](./guide/cart), or the
[complete checkout flow](./guide/checkout).
