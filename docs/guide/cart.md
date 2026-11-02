# Create and manage a cart

`storefront.cart` owns the active cart capability, persists it across reloads,
serializes mutations, and exposes only render-safe state to subscribers.

## Subscribe before rendering

```ts
const unsubscribe = storefront.cart.subscribe(snapshot => {
    cartStore.set({
        cart: snapshot.cart,
        busy: snapshot.isBusy,
        error: snapshot.lastError
    });
});

// Call this when the owning view or application is disposed.
unsubscribe();
```

The listener runs immediately with the current snapshot and after every cart
state change. `getSnapshot()` provides the same value synchronously:

```ts
const snapshot = storefront.cart.getSnapshot();
```

`CartSnapshot` never includes cart keys, order keys, or other capabilities.

## Restore a saved cart

```ts
const snapshot = await storefront.cart.restore();

if (snapshot.hasCart && snapshot.cart) {
    renderCart(snapshot.cart);
}
```

`refresh()` is an alias for `restore()` when you want to reread the current
cart from Sales. A stale or completed cart capability is removed automatically.

`hasCart` can be true while `cart` is still null immediately after SDK creation:
that means a saved capability exists but has not been loaded. Call `restore()`
before changing a specific line. `add()` performs this restoration for you.

| `hasCart` | `cart` | Meaning |
| --- | --- | --- |
| `false` | `null` | No active cart capability |
| `true` | `null` | Capability saved; not loaded yet—call `restore()` |
| `true` | object | Authoritative cart is ready to render |

## Add products

The first addition creates the cart. Later additions replace the authoritative
line input set through Sales:

```ts
const snapshot = await storefront.cart.add({
    productId: product.id,
    qty: 1,
    notes: null
});

renderCart(snapshot.cart);
```

Adding the same `productId` and `notes` combination increments its quantity.
Different notes produce separate lines.

## Change a line quantity

Use the cart line's `id`, not the product ID:

```ts
const cart = storefront.cart.getSnapshot().cart;
const line = cart?.items[0];

if (line) {
    await storefront.cart.setQuantity({
        cartItemId: line.id,
        qty: line.qty + 1
    });
}
```

Passing `qty: 0` removes the line. Use positive quantities for retained lines.

## Remove a line

```ts
await storefront.cart.remove({ cartItemId: line.id });
```

Removing the last line abandons the server cart and clears the local capability.

## Replace the whole cart

`setItems()` is useful for importing a saved list or applying a local cart
editor in one authoritative operation:

```ts
await storefront.cart.setItems([
    { productId: firstProduct.id, qty: 2 },
    { productId: secondProduct.id, qty: 1, notes: 'No gift box.' }
]);
```

This is a full replacement, not a patch. Items omitted from the array are
removed. Passing an empty array abandons the active cart.

## Empty or forget a cart

Abandon the cart in Sales and clear local state:

```ts
await storefront.cart.abandon();
```

Forget only the local capability without contacting Sales:

```ts
storefront.cart.clear();
```

Prefer `abandon()` for an ordinary “empty cart” action. Use `clear()` for local
reset/logout policies where the browser must stop retaining the capability even
if the network is unavailable.

## Render authoritative totals

All money is expressed in **minor units** for the storefront currency from
`getConfig()`. For USD, `2599` means `$25.99`:

```ts
const config = await storefront.getConfig();
const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: config.currency.toUpperCase()
});

function formatMoney(amount: number): string {
    return money.format(amount / 100);
}

const cart = storefront.cart.getSnapshot().cart;
if (cart) {
    total.textContent = formatMoney(cart.priceTotal);
    due.textContent = formatMoney(cart.priceDue);
}
```

Useful cart fields:

| Field | Display as |
| --- | --- |
| `item.priceTotal` | Line total |
| `cart.priceDiscounted` | Discounted merchandise subtotal |
| `cart.priceTax` | Tax total |
| `cart.priceTotal` | Order total |
| `cart.priceDue` | Amount still due |
| `cart.appliedDiscount` | Active discount summary |
| `cart.taxStatus` | Tax readiness (`ok`, `unresolved`, `failed`) |
| `cart.fulfillment` | Applied recipient and shipping selection |

Do not recalculate tax, shipping, discounts, or order totals in the browser.

## Mutation and payment state

Cart mutations are queued in call order, so rapid add-to-cart clicks do not race
one another. Any authoritative cart mutation invalidates an unfinished payment
setup. Begin payment only after cart, buyer, fulfillment, and discount edits are
complete.

## Next steps

- [Collect buyer details, delivery, and discounts](./checkout)
- [State, recovery, and errors](./state-and-errors)

## Membership selections in mixed carts

Membership inputs accept `membership: { pricingTierId }`. Cart updates preserve
the server-selected tier while you change quantities or remove ordinary products.
Membership quantities remain one; choose a tier through a replacement input when
changing the membership selection. Read `cart.membershipRequirements` for buyer,
billing address, recurring consent, and reusable-card requirements.

### Promotion price groups

When Sales supplies `automaticPromotion` and an item's `priceGroups`, render the
promotion name and savings from the cart and the exact quantity, unit price,
and extended amount of each group. Amounts are in minor currency units before
item tax. Use the cart's `priceTotal` for the payable total; do not reconstruct
it from displayed unit prices. An order may include the frozen group amounts
and promotion name on each item. Fields are absent when no automatic promotion
applies to the cart or order.
If `automaticPromotionSuppressedReason` is present, show the server-provided
reason with the cart totals.

New carts use revision-aware pricing by default. Set `automaticPromotions: false`
in `createZynoSales` when connecting to an older Sales server that does not yet
support this protocol. A previously created cart continues with its existing
protocol after it is restored.

For a revision-aware cart, keep the server-provided `selectionId` when calling
`setItems` for a retained selection. `add`, `setQuantity`, and `remove` do this
for you. New selections receive unique IDs. Sales rejects stale revisions; the
SDK refreshes the cart and surfaces the conflict without replaying the change.
Review the updated cart and submit the intended change again.

`refresh()` reads the cart without changing an accepted payment attempt. When
Sales reports that promotion terms changed, call `refreshPricing()` to request a
new evaluation, then show the resulting groups and total for the shopper to
review. A cart with an active payment attempt cannot be repriced until that
attempt is resolved or canceled. Legacy carts use a normal read for this call.
