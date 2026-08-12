# Checkout

The SDK coordinates API state transitions; it does not prescribe screens.

```ts
await storefront.cart.restore();
await storefront.cart.add({ productId, qty: 1 });

await storefront.checkout.setBuyer({ name, email, phone });
const verification = await storefront.checkout.verifyAddress({ address });
const rates = await storefront.checkout.getShippingRates({ address });
const quote = await storefront.checkout.quoteShippingSelection({
    shippingPlanId,
    packageRates
});
await storefront.checkout.setFulfillment({ recipient, shippingPlanId, packageRates });
```

Subscribe to `storefront.cart` and `storefront.checkout` to drive your UI. The
snapshots contain server-authoritative totals and safe status, but never cart or
order capability keys.

Money values are minor units. Always display the totals returned by the server;
do not sum product or package-rate prices in the browser.

The current embedded Sales contract does not expose modifier selections yet.
The SDK deliberately does not invent a local modifier or variant API. Modifier
support will arrive through new generated embedded operations once Sales owns
that browser contract.
