# State, recovery, and errors

The SDK separates safe render state from persisted capabilities. Understanding
that boundary makes reloads, retries, SSR, and error handling predictable.

## Cart snapshot

```ts
type CartSnapshot = {
    cart: Cart | null;
    hasCart: boolean;
    isBusy: boolean;
    lastError: PublicError | null;
};
```

| Field | Meaning |
| --- | --- |
| `hasCart` | A persisted cart capability exists |
| `cart` | Last loaded authoritative cart, or `null` before restore |
| `isBusy` | Cart restoration or mutation is in flight |
| `lastError` | Safe to render; excludes capabilities and API internals |

## Checkout snapshot

```ts
type CheckoutSnapshot = {
    order: Order | null;
    paymentAttemptId: string | null;
    paymentAttemptStatus: string | null;
    isBusy: boolean;
    lastError: PublicError | null;
};
```

The completed public order remains available in the checkout snapshot after the
SDK clears its cart. A later cart mutation resets the completed order so the
same storefront instance can handle another purchase.

## Public errors

```ts
const snapshot = storefront.cart.getSnapshot();

switch (snapshot.lastError?.kind) {
    case 'network':
        showRetryMessage();
        break;
    case 'capability-lost':
        showCartExpiredMessage();
        break;
    case 'api':
        showCheckoutMessage(snapshot.lastError.message);
        break;
}
```

| `kind` | Typical cause | Local capability |
| --- | --- | --- |
| `network` | Transport failure; no HTTP status | Kept so the buyer can retry |
| `capability-lost` | Cart/order no longer valid (HTTP 404) | Cleared automatically |
| `api` | Validated business or request error | Depends on the operation |

Operations also reject with `ZynoSalesError` for imperative error handling:

```ts
import { ZynoSalesError } from '@zyno-io/zynosales-ecommerce-sdk';

try {
    await storefront.cart.refresh();
} catch (error) {
    if (error instanceof ZynoSalesError && error.isNetworkError) {
        showRetryButton();
    } else {
        throw error;
    }
}
```

`ZynoSalesError` exposes `status`, `isNetworkError`, and `isCapabilityLost`.
Failed operations also update `lastError` on the relevant snapshot, so
subscription-driven UIs and `try/catch` paths stay aligned.

## Persistence defaults

| State | Default storage | Lifetime |
| --- | --- | --- |
| Cart and order capabilities | `localStorage` | Across browser reloads and sessions |
| Payment attempt recovery | `sessionStorage` | Current browser tab/session |
| Completed-order marker | `sessionStorage` | Current browser tab/session, bounded to one order |
| Product list cache | Memory | Current storefront instance |
| Runtime config cache | Memory | Current storefront instance |

Storage keys are isolated by API base and publishable key before configuration,
then by the Sales tenant once configuration is known. The SDK reconciles and
rekeys cart and payment state when `getConfig()` resolves.

When browser storage throws or is unavailable, the defaults fall back to memory.
Inject `ZynoSalesStorage` implementations to integrate a different synchronous
storage policy.

## Startup sequence

```ts
const config = await storefront.getConfig();
const cart = await storefront.cart.restore();

renderCapabilities(config.capabilities);
renderCart(cart.cart);
```

Loading configuration first scopes persisted state to the resolved storefront
tenant before cart restoration. Cart and checkout operations are serialized
internally per storefront instance.

On a Stripe return route, follow restoration with payment recovery as shown in
[Stripe and order completion](./stripe#handle-a-redirected-or-interrupted-payment).

## SSR behavior

Creating the SDK during SSR is safe: when `window` is absent, default storage is
in memory. That server instance cannot restore the browser's saved cart. Create
or reuse the browser storefront during hydration and call `cart.restore()`
there.

Do not serialize the SDK instance, cart access, client secrets, or storage
contents into HTML. Serialize only render-safe catalog/cart/order data that your
application intentionally exposes.

## Capability safety

Cart and order keys grant access; they are not identifiers. The SDK deliberately
omits them from snapshots and hooks other than the explicit `beforePayment`
handoff. Avoid reading or copying SDK storage directly. Use `withServerAccess()`
only for a short same-origin merchant-server request.

## Next steps

- [Server handoff](./server-handoff)
- [Lifecycle hooks](./hooks)
