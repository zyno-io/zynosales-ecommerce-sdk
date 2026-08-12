# Server handoff

Use `beforePayment` only when your own trusted server must update or validate
the active cart immediately before payment setup. The hook receives a transient
cart ID/key pair that is intentionally excluded from cart snapshots.

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    hooks: {
        async beforePayment({ cartAccess }) {
            await fetch('/api/store/enrich-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartId: cartAccess.cartId,
                    cartKey: cartAccess.cartKey
                })
            });
        }
    }
});
```

Send the values only to your same-origin trusted server. Do not put them in a
URL, analytics event, log, browser-visible error, or third-party request. Your
server must validate its own session and independently decide any policy; it
must not trust browser assertions or persist the cart key.
