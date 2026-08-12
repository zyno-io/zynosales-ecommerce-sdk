# Guide

`@zyno-io/zynosales-ecommerce-sdk` is a framework-neutral JavaScript SDK for
the ZynoSales embedded storefront API. It provides no components, styles,
routing, or checkout markup. Your site decides how to render catalog, cart,
and checkout state.

## What the SDK owns

- Product catalog reads and explicit in-memory caching
- Persistent cart creation, restoration, and serialized mutations
- Buyer, address, shipping, fulfillment, and discount workflows
- Card-payment setup, Sales confirmation, and interrupted-payment recovery
- Render-safe cart and checkout snapshots for any UI framework
- Lifecycle hooks for merchant policy and completed-order follow-up

ZynoSales remains authoritative for money, taxes, discounts, shipping, and
order status. Your browser code should render those returned values rather than
reimplementing commerce rules.

## What your application owns

- Product grids, cart drawers, and checkout forms
- Stripe.js loading and payment Element mounting
- Route changes, form validation messaging, and accessibility
- Merchant-server policy, provisioning, and order follow-up

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
        error: snapshot.lastError,
        currency: config.currency
    });
});
```

`renderCart` is your application code. Subscriptions emit immediately and then
after each state change, so they work naturally with framework stores or a
small DOM renderer.

## Storefront surface

| Member | Use it for |
| --- | --- |
| `catalog` | Listing products and loading a product by slug |
| `cart` | Restoring, mutating, and observing the active cart |
| `checkout` | Buyer, delivery, discounts, payment, and recovery |
| `getConfig()` | Runtime capabilities, currency, and Stripe settings |
| `getStripeConfiguration()` | Options for `loadStripe` without bundling Stripe.js |
| `client` | Advanced access to the generated Sales contract client |

## Recommended path

1. [Install and configure the SDK](./installation)
2. [Load and display products](./products)
3. [Create, restore, and manipulate a cart](./cart)
4. [Collect buyer details, delivery, and discounts](./checkout)
5. [Complete card or zero-due orders](./stripe)
6. [Connect lifecycle hooks](./hooks)
7. [Handle state, recovery, and errors](./state-and-errors)
8. [Hand off to a trusted merchant server when needed](./server-handoff)

Use the [generated API reference](../api/) when you need exact signatures or
lower-level contract types.
