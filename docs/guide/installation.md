# Install and configure

## Requirements

- Node.js 22 or later for package tooling and local builds
- A ZynoSales storefront **publishable key** (`zs_pk_...`)
- `fetch`, which is available in current browsers and supported Node versions

Publishable keys are safe to embed in browser bundles. Cart keys, order keys,
and Stripe client secrets are not.

## Install

```sh
yarn add @zyno-io/zynosales-ecommerce-sdk
```

```sh
npm install @zyno-io/zynosales-ecommerce-sdk
```

```sh
pnpm add @zyno-io/zynosales-ecommerce-sdk
```

The package is ESM-only, tree-shakeable, framework-neutral, and ships TypeScript
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

Create **one storefront instance per publishable key** and reuse it throughout
the application. The instance owns the in-memory catalog cache and serializes
cart and checkout operations.

## Use a local test endpoint

| Option | When to use |
| --- | --- |
| _(default)_ | Production Sales endpoint |
| `apiBase: 'http://localhost:3000'` | Explicit local or controlled test endpoint |

```ts
// Explicit base for local or controlled testing
const localStorefront = createZynoSales({
    publishableKey: 'zs_pk_test_...',
    apiBase: 'http://localhost:3000'
});
```

Non-local endpoints must use HTTPS. Most applications should omit `apiBase` and
use the default production endpoint.

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

if (config.capabilities.addressVerification) {
    showAddressVerificationStep();
}

if (config.payments.cardEnabled) {
    showCardPaymentOption();
}

// Money fields are minor units in this currency (for example usd → cents).
const currency = config.currency;
```

`getConfig()` caches the response for the storefront instance. Use
`refreshConfig()` only when you intentionally need fresh runtime configuration.

Loading configuration also scopes persisted cart and payment storage to the
resolved Sales tenant. Prefer calling it early during app startup.

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

Recommended startup order:

```ts
const storefront = createZynoSales({ publishableKey: 'zs_pk_...' });
const config = await storefront.getConfig();
const cart = await storefront.cart.restore();

// On Stripe return routes, also call storefront.checkout.recoverPayment().
```

## Inject storage and fetch for tests

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_test_...',
    apiBase: 'http://localhost:3000',
    fetch: mockFetch,
    storage: persistentCartStorage,
    sessionStorage: paymentRecoveryStorage
});
```

| Option | Default in browsers | Purpose |
| --- | --- | --- |
| `storage` | `localStorage` | Cart and order capabilities |
| `sessionStorage` | `sessionStorage` | Payment recovery and completed-order markers |
| `fetch` | global `fetch` | HTTP transport |
| `hooks` | none | Lifecycle callbacks |

When browser storage throws or is unavailable (including SSR without `window`),
the SDK falls back to in-memory storage for that instance.

## Advanced: raw contract client

If you need the generated Sales client without cart orchestration:

```ts
import { createZynoSalesClient } from '@zyno-io/zynosales-ecommerce-sdk';

const client = createZynoSalesClient({
    publishableKey: 'zs_pk_...'
});
```

Most storefronts should use `createZynoSales()` instead.

## Next steps

- [Load and display products](./products)
- [Create and manage a cart](./cart)
- [State, recovery, and errors](./state-and-errors)
