# @zyno-io/zynosales-ecommerce-sdk

Framework-neutral TypeScript SDK for ZynoSales embedded ecommerce storefronts.

The package owns catalog reads, cart persistence, checkout workflows, payment
recovery, and lifecycle hooks. Your website owns rendering, routing, styling,
and Stripe Elements. Sales remains authoritative for money, tax, discounts,
shipping, and order status.

## Install

```sh
yarn add @zyno-io/zynosales-ecommerce-sdk
# or: npm install @zyno-io/zynosales-ecommerce-sdk
# or: pnpm add @zyno-io/zynosales-ecommerce-sdk
```

Requires Node.js 22+ for package tooling. Browser runtimes need `fetch`.

## Quick start

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({ publishableKey: 'zs_pk_...' });

const products = await storefront.catalog.getProducts();
await storefront.cart.restore();

const firstProduct = products[0];
if (firstProduct) {
    await storefront.cart.add({ productId: firstProduct.id, qty: 1 });
}

storefront.cart.subscribe(snapshot => {
    // Render snapshot.cart, snapshot.isBusy, and snapshot.lastError.
});
```

## What the SDK provides

| Surface | Responsibility |
| --- | --- |
| `storefront.catalog` | Product list/detail reads with an explicit in-memory list cache |
| `storefront.cart` | Create, restore, mutate, and abandon a persistent cart |
| `storefront.checkout` | Buyer, address, shipping, discounts, card setup, recovery |
| `storefront.getConfig()` | Runtime capabilities, currency, and Stripe browser settings |
| Hooks | `onCartChanged`, `beforePayment`, `afterOrderCompleted` |

It does **not** ship UI components, CSS, routing, Stripe.js, or checkout markup.

## Documentation

- [Get started](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/)
- [Install and configure](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/installation)
- [Load products](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/products)
- [Create and manage a cart](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/cart)
- [Build checkout](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/checkout)
- [Stripe and order completion](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/stripe)
- [Lifecycle hooks](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/hooks)
- [State, recovery, and errors](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/state-and-errors)
- [Server handoff](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/server-handoff)
- [API reference](https://zyno-io.github.io/zynosales-ecommerce-sdk/api/)

## Local development

```sh
yarn install
yarn test
yarn docs:dev
```

See `examples/vanilla-storefront` for a minimal call-sequence reference.
