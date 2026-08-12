# Installation

Install the package:

```sh
npm install @zyno-io/zynosales-ecommerce-sdk
```

Create a storefront with a Sales publishable key. Production is embedded as the
default API base:

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: 'zs_pk_...'
});
```

Use alpha without manually supplying a host URL:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    environment: 'alpha'
});
```

`apiBase` is an explicit local/test override. It is not needed for production or alpha.

Call `getConfig()` before rendering payment availability. It is runtime data
from Sales, so browser-safe configuration can change without rebuilding your site.
