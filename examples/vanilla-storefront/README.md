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

The [`customer-auth.html`](./customer-auth.html) page and
[`customer-auth.ts`](./customer-auth.ts) show password and email-code sign in,
account creation, password reset emails, checkout with an account, order history,
and sign-out on a static site. Sign-in is remembered across tabs with
`localStorage`, and the SDK checks with Zyno when a customer returns. You need
only the browser bundle, a publishable key, and customer accounts enabled for
your storefront in Zyno.

## Use it

1. Replace `<your-publishable-key>` in `main.ts` with a real publishable key.
2. Bundle or import `main.ts` from your preferred browser tooling.
3. Connect `CartSnapshot` values (`cart`, `isBusy`, `lastError`) to your own UI.

For the account example, replace the publishable key in `customer-auth.ts`,
bundle it to `customer-auth.js`, and serve both files together from an approved
HTTPS storefront origin. No merchant API key or server-side proxy is used.

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
