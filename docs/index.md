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

### Recommended path

1. [Install and configure](./guide/installation)
2. [Load products](./guide/products)
3. [Create and manage a cart](./guide/cart)
4. [Collect buyer, delivery, and discounts](./guide/checkout)
5. [Complete card or zero-due orders](./guide/stripe)
6. [Wire lifecycle hooks](./guide/hooks) and [handle recovery](./guide/state-and-errors)

Need exact signatures? Use the [API reference](./api/).
