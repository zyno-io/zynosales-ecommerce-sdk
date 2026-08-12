# Install and configure

## Requirements

- Node.js 22 or later for builds and tooling.
- A ZynoSales storefront publishable key. Publishable keys are safe to use in
  browser bundles; cart and order capability keys are not.
- `fetch`, which is available in current browsers and supported Node versions.

## Install

```sh
yarn add @zyno-io/zynosales-ecommerce-sdk
```

The package is ESM, tree-shakeable, framework-neutral, and includes TypeScript
declarations.

## Create a storefront

Production is the default endpoint, so most applications only need a
publishable key:

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: 'zs_pk_...'
});
```

Create one storefront instance for each publishable key and reuse it throughout
the application. The instance owns the in-memory catalog cache and serializes
cart and checkout operations.

## Read runtime capabilities

Call `getConfig()` before deciding which checkout controls to show:

```ts
const config = await storefront.getConfig();

if (config.capabilities.shipping) {
    showDeliveryStep();
}

if (config.capabilities.discountCodes) {
    showDiscountCodeField();
}

if (config.payments.cardEnabled) {
    showCardPaymentOption();
}
```

`getConfig()` caches the response for the storefront instance. Use
`refreshConfig()` only when you intentionally need fresh runtime configuration.

## Restore state at startup

Cart capabilities are persisted automatically. Restore the authoritative cart
before rendering a saved cart or changing a specific line:

```ts
const cart = await storefront.cart.restore();

if (cart.hasCart) {
    renderCart(cart.cart);
}
```

`add()` also restores a persisted cart automatically before appending a product,
so an early add-to-cart click will not overwrite saved lines.

## Local development and tests

Use an explicit `apiBase` only for a local or controlled test endpoint:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_test_...',
    apiBase: 'http://localhost:3000'
});
```

Non-local endpoints must use HTTPS. Tests can also inject `fetch`, persistent
storage, and session storage:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_test_...',
    apiBase: 'http://localhost:3000',
    fetch: mockFetch,
    storage: persistentCartStorage,
    sessionStorage: paymentRecoveryStorage
});
```

In browsers, cart capabilities default to `localStorage` and payment recovery
defaults to `sessionStorage`. When either API is unavailable, the SDK safely
falls back to in-memory storage for that instance.
