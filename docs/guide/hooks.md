# Hooks

Hooks connect host application behavior to SDK lifecycle events without tying
the SDK to a UI framework. Pass them once when creating the storefront:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    hooks: {
        onCartChanged(snapshot) {
            cartStore.set(snapshot);
        },
        async beforePayment(context) {
            await validateCartOnMerchantServer(context.cartAccess);
        },
        async afterOrderCompleted({ order }) {
            await provisionPurchase(order.id);
        }
    }
});
```

These are SDK lifecycle callbacks, not React hooks. They work the same way in
Vue, React, Svelte, plain JavaScript, or a custom state layer.

## `onCartChanged`

```ts
onCartChanged(snapshot) {
    cartStore.set({
        cart: snapshot.cart,
        busy: snapshot.isBusy,
        error: snapshot.lastError
    });
}
```

The hook receives the same render-safe `CartSnapshot` as `cart.subscribe()` and
runs immediately during storefront creation. It then runs for cart loads,
mutations, busy transitions, errors, key-scope reconciliation, and local clears.

Use either `onCartChanged` for application-wide wiring or `cart.subscribe()`
when a component needs an unsubscribe function. Using both is valid, but both
callbacks will receive the same updates.

`CartSnapshot` never includes cart or order capability keys.

## `beforePayment`

```ts
async beforePayment({ cart, cartAccess }) {
    const response = await fetch('/api/store/prepare-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(cartAccess)
    });

    if (!response.ok) {
        throw new Error('The cart could not be prepared for payment.');
    }
}
```

This hook runs immediately before a **new** payment setup. It receives:

| Field | Contents |
| --- | --- |
| `cart` | Current render-safe authoritative cart |
| `cartAccess.cartId` | Active Sales cart ID |
| `cartAccess.cartKey` | Transient capability for your trusted merchant server |

After the hook resolves, the SDK refreshes the cart from Sales. This lets your
server attach policy-driven data or reject checkout before the payment amount is
created. Throwing or rejecting prevents payment setup and appears as checkout
error state.

The hook is **not** rerun while recovering or retrying the same persisted payment
setup. This preserves the setup's idempotency key and amount.

Treat `cartAccess` as a secret. Send it only to a same-origin trusted server;
never put it in a URL, log, analytics event, third-party request, or UI state.
See [server handoff](./server-handoff) for the security boundary.

## `afterOrderCompleted`

```ts
async afterOrderCompleted({ order, cartId }) {
    await fetch('/api/store/order-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            orderId: order.id,
            cartId
        })
    });
}
```

This hook runs after Sales returns a paid order from:

- card confirmation (`completeCardPayment`)
- zero-due finalization (`beginCardPayment` returning `null` after finalization)
- payment recovery (`recoverPayment`)

It receives the completed public order and originating cart ID; it never
receives the order capability.

The SDK records a bounded completed-order marker in session storage before
invoking the hook and will not invoke it again for the same stored order during
polling or recovery. The marker is replaced when a later cart/order completes.

Hook failure does not turn a completed payment into a failed checkout. The SDK
catches the hook error because Sales has already completed the order. Your
merchant endpoint should therefore:

- be idempotent by `order.id`
- authenticate the browser session
- look up and verify the order server-side before provisioning
- own its retry/alerting policy when follow-up work is critical

## Hook timing

```text
cart mutation
  -> onCartChanged
  -> beginCardPayment
  -> beforePayment (new setups only)
  -> cart refresh
  -> Stripe authorization
  -> Sales order completion
  -> cart cleared + checkout snapshot updated
  -> afterOrderCompleted (once per stored order)
```

For UI-only reactions, prefer subscriptions. Use hooks when behavior belongs at
the storefront lifecycle boundary or must be configured centrally.

## Next steps

- [Server handoff](./server-handoff)
- [State, recovery, and errors](./state-and-errors)
