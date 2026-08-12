# Vanilla storefront reference

Minimal call-sequence example for `@zyno-io/zynosales-ecommerce-sdk`.

This intentionally contains no component library, routing, styles, or checkout
markup. It shows the SDK calls a website uses before rendering catalog and cart
state itself.

## What it demonstrates

1. Creating a storefront with a publishable key
2. Loading products from the catalog
3. Adding the first product to a cart
4. Subscribing to render-safe `CartSnapshot` updates

## Use it

1. Replace `<your-publishable-key>` in `main.ts` with a real publishable key.
2. Bundle or import `main.ts` from your preferred browser tooling.
3. Connect `CartSnapshot` values (`cart`, `isBusy`, `lastError`) to your own UI.

## Not included

- Product grids or cart drawers
- Buyer, shipping, discount, or payment forms
- Stripe Elements
- Merchant-server hooks

For those flows, follow the published guide:

- [Install and configure](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/installation)
- [Cart](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/cart)
- [Checkout](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/checkout)
- [Stripe](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/stripe)
