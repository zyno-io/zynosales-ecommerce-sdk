# @zyno-io/zynosales-ecommerce-sdk

Framework-neutral JavaScript APIs for ZynoSales embedded ecommerce storefronts.
It provides catalog, cart, checkout, payment recovery, and lifecycle workflows;
your website provides all rendering and UI.

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({ publishableKey: 'zs_pk_...' });
await storefront.cart.restore();
```

See the published VitePress site for the integration Guide and generated SDK API reference.
