# Load and display products

Product reads live under `storefront.catalog`. The catalog API returns
browser-safe product data and keeps list results in memory to avoid unnecessary
requests while a user navigates your storefront.

## List products

```ts
const config = await storefront.getConfig();
const products = await storefront.catalog.getProducts();

const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: config.currency.toUpperCase()
});

for (const product of products) {
    renderProductCard({
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceLabel: money.format(product.price / 100),
        imageUrl: product.images[0]?.url
    });
}
```

Each `StoreProduct` includes:

| Field | Meaning |
| --- | --- |
| `id` | Stable product ID used in cart item inputs |
| `slug` | Public lookup and routing identifier |
| `name`, `description` | Storefront display content |
| `price` | Current catalog price in minor currency units |
| `type` | `standard` or `variant` |
| `images` | Public image records with URL and content type |
| `shippingMeta` | Optional physical dimensions and shipping metadata |
| `variant` | Optional variant group, option definitions, and selected values |

Catalog prices are useful for product cards. Once an item is in a cart, display
the authoritative line and cart totals returned in the cart snapshot—do not keep
using the catalog price for checkout math.

## Fetch a product by slug

Use the slug from your route, not a cart item ID:

```ts
const product = await storefront.catalog.getProduct(route.params.slug);

renderProductPage(product);
```

Individual product reads always request the current product from Sales.

## Cache behavior

`getProducts()` returns the cached list after its first successful request.
Request a fresh list explicitly:

```ts
const products = await storefront.catalog.getProducts({ refresh: true });
```

Or clear the cache without issuing a request:

```ts
storefront.catalog.clearCache();
```

The next `getProducts()` call will fetch again. The cache lives only for the
current storefront instance; it is not written to `localStorage`.

## Variants

When `product.type === 'variant'`, inspect `product.variant` to build option
selectors. Variant metadata describes:

- the variant group (`groupId`, `groupSlug`, `groupName`)
- available option definitions
- the selected option values for that sellable product

Add the **sellable product's** `id` to the cart. The cart API does not accept a
separate browser-side modifier payload.

## Add a listed product to the cart

```ts
await storefront.cart.add({
    productId: product.id,
    qty: 1
});
```

Use `notes` when the line needs buyer-provided text supported by your
storefront:

```ts
await storefront.cart.add({
    productId: product.id,
    qty: 1,
    notes: 'Gift wrap, please.'
});
```

The SDK merges additions only when both `productId` and `notes` match an
existing line input.

## Next steps

- [Create and manage a cart](./cart)
- [Buyer, delivery, and discounts](./checkout)
