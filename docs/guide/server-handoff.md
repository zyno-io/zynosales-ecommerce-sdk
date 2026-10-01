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

## Signed-in buyers

When `config.capabilities.pinnedBuyer` is true, your merchant server can pin a
signed-in shopper's CRM contact as the cart buyer. In `beforePayment`, send
`cartAccess` to an authenticated same-origin route as in the example above.
For guests, keep the ordinary buyer-details flow.

Your route authenticates its application session, reads the CRM contact ID from
its own account records, and creates or links the contact if needed. It then
calls Sales through the authenticated API gateway using its tenant API key
with HTTP Basic authentication (username `api`, password the API key):

```http
PUT /sales/ecomm/carts/:cartId/buyer-contact
Content-Type: application/json
Authorization: Basic <base64 of api:tenant-api-key>

{
    "cartKey": "<cart capability>",
    "crmContactId": "<active CRM contact id>"
}
```

Accept only `cartId` and `cartKey` from the browser; decide the contact on your
server. Both the API key and cart key are required. Knowing a cart ID alone must
not allow someone to attach their own membership to a purchase paid for by
another shopper. Keep both credentials transient and out of logs, and return
only success or a display-safe error from the merchant route.

The SDK refreshes the cart after `beforePayment`. The refreshed
`cart.buyerContactPinned` flag lets your UI lock or hide the email field. The
contact ID is never included in the public cart. Buyer name, email, and phone
remain receipt details, and membership checkout still requires name and email.
The pin survives `checkout.setBuyer()` and item edits.

Changing the pin clears membership terms acceptance and prepared billing. For
recurring memberships, use `cart.withServerAccess()` to pin the buyer before
showing consent, then refresh the cart. Reassert the same pin in `beforePayment`;
an unchanged pin preserves acceptance. If the pin changes during that hook,
show the refreshed terms and collect consent again before retrying payment.
Send `crmContactId: null` to remove a pin, such as when your application handles
sign-out.

A wrong cart key returns `403`. A cart that is closed or has payment in progress
returns `409`; the endpoint does not cancel an active payment. Missing, inactive,
or merged contacts are rejected with `400`. If the contact changes after
pinning, payment preparation returns `409` asking you to re-pin. Repair your
account's CRM link and explicitly pin the chosen contact again; Sales does not
silently follow a merge.

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
changes the Sales cart so browser snapshots match the new authoritative state.

## Merchant-server requirements

The browser request is not proof that the caller owns the cart. Your endpoint
must:

1. authenticate and authorize its own application session
2. accept the cart capability only in a TLS-protected request body
3. independently decide the policy or mutation to apply
4. use the capability only for the immediate Sales request
5. return no cart key, order key, client secret, or privileged Sales data

Do not put capability values in URLs, query strings, logs, traces, analytics,
error messages, data attributes, third-party services, or durable merchant
storage.

## Completed-order follow-up

Use [`afterOrderCompleted`](./hooks#afterordercompleted) for provisioning,
receipt requests, or account linking. Send only the public order ID and your own
session context to the merchant server, then fetch and verify the order from a
trusted backend. Make the endpoint idempotent by order ID.

## When you do not need a server handoff

Skip merchant-server cart access if you only need to:

- render catalog, cart, and checkout state
- collect buyer and shipping details through the SDK
- complete Stripe payment and show a receipt
- track analytics with public order IDs after completion

Use a handoff when policy, inventory reservation, custom pricing, or
account-specific eligibility must run on a server you control.
