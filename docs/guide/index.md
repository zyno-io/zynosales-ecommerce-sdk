# Guide

`@zyno-io/zynosales-ecommerce-sdk` is a framework-neutral JavaScript SDK for
the ZynoSales embedded storefront API. It provides no components, styles,
routing, or checkout markup. Your site decides how to render catalog, cart,
and checkout state.

## What the SDK owns

- Product catalog reads and explicit in-memory caching.
- Persistent cart creation, restoration, and serialized mutations.
- Buyer, address, shipping, fulfillment, and discount workflows.
- Card-payment setup, Sales confirmation, and interrupted-payment recovery.
- Render-safe cart and checkout snapshots for any UI framework.
- Lifecycle hooks for merchant policy and completed-order follow-up.

ZynoSales remains authoritative for money, taxes, discounts, shipping, and
order status. Your browser code should render those returned values rather than
reimplementing commerce rules.

## Your first working flow

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({ publishableKey: 'zs_pk_...' });

const config = await storefront.getConfig();
const products = await storefront.catalog.getProducts();
const restored = await storefront.cart.restore();
const firstProduct = products[0];

if (!restored.hasCart && firstProduct) {
    await storefront.cart.add({ productId: firstProduct.id, qty: 1 });
}

const unsubscribe = storefront.cart.subscribe(snapshot => {
    renderCart(snapshot.cart, {
        busy: snapshot.isBusy,
        error: snapshot.lastError
    });
});
```

`renderCart` is your application code. Subscriptions emit immediately and then
after each state change, so they work naturally with framework stores or a
small DOM renderer.

## Recommended path

1. [Install and configure the SDK](./installation).
2. [Load and display products](./products).
3. [Create, restore, and manipulate a cart](./cart).
4. [Collect buyer details, delivery, and discounts](./checkout).
5. [Complete card or zero-due orders](./stripe).
6. [Connect lifecycle hooks](./hooks) and [handle recovery](./state-and-errors).

Use the [generated API reference](../api/) when you need exact signatures or
the lower-level generated-contract client.
