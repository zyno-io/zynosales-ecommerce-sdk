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

All money is expressed in minor units. For USD, `2599` means `$25.99`:

```ts
const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
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

Use `item.priceTotal`, `cart.priceDiscounted`, `cart.priceTax`,
`cart.priceTotal`, and `cart.priceDue` from Sales. Do not recalculate tax,
shipping, discounts, or order totals in the browser.

## Mutation and payment state

Cart mutations are queued in call order, so rapid add-to-cart clicks do not race
one another. Any authoritative cart mutation invalidates an unfinished payment
setup. Begin payment only after cart, buyer, fulfillment, and discount edits are
complete.
