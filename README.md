# @zyno-io/zynosales-ecommerce-sdk

Framework-neutral JavaScript APIs for ZynoSales embedded ecommerce storefronts.
It provides catalog, cart, checkout, payment recovery, and lifecycle workflows;
your website provides all rendering and UI.

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({ publishableKey: 'zs_pk_...' });
const products = await storefront.catalog.getProducts();
await storefront.cart.restore();

const firstProduct = products[0];
if (firstProduct) {
    await storefront.cart.add({ productId: firstProduct.id, qty: 1 });
}
```

Documentation:

- [Get started](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/)
- [Load products](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/products)
- [Create and manage a cart](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/cart)
- [Build checkout](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/checkout)
- [Connect lifecycle hooks](https://zyno-io.github.io/zynosales-ecommerce-sdk/guide/hooks)
- [Browse the API reference](https://zyno-io.github.io/zynosales-ecommerce-sdk/api/)
