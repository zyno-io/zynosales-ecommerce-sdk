# Server handoff

Most storefronts can stay entirely on the public SDK. Use a server handoff only
when your own trusted merchant service must inspect, validate, or update the
active Sales cart.

## Preferred: `beforePayment`

`beforePayment` places the handoff at the last safe point before a new payment
amount is created:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    hooks: {
        async beforePayment({ cartAccess }) {
            const response = await fetch('/api/store/prepare-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    cartId: cartAccess.cartId,
                    cartKey: cartAccess.cartKey
                })
            });

            if (!response.ok) throw new Error('Cart validation failed.');
        }
    }
});
```

The SDK refreshes the cart after the hook, then uses the refreshed `priceDue`
for zero-due finalization or card setup.

## Explicit one-call access

For an earlier trusted-server action, scope capability access to a callback:

```ts
const result = await storefront.cart.withServerAccess(async cartAccess => {
    const response = await fetch('/api/store/reprice-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(cartAccess)
    });

    if (!response.ok) throw new Error('The cart could not be repriced.');
    return response.json();
});

await storefront.cart.refresh();
```

`withServerAccess()` does not refresh automatically. Refresh after your server
changes the Sales cart.

## Merchant-server requirements

The browser request is not proof that the caller owns the cart. Your endpoint
must:

1. authenticate and authorize its own application session;
2. accept the cart capability only in a TLS-protected request body;
3. independently decide the policy or mutation to apply;
4. use the capability only for the immediate Sales request; and
5. return no cart key, order key, client secret, or privileged Sales data.

Do not put capability values in URLs, query strings, logs, traces, analytics,
error messages, data attributes, third-party services, or durable merchant
storage.

## Completed-order follow-up

Use [`afterOrderCompleted`](./hooks#afterordercompleted) for provisioning,
receipt requests, or account linking. Send only the public order ID and your own
session context to the merchant server, then fetch and verify the order from a
trusted backend. Make the endpoint idempotent by order ID.
