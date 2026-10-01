# Type Alias: ISalesEcommStorefrontConfigResponse

> **ISalesEcommStorefrontConfigResponse** = `object`

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### capabilities

> **capabilities**: `object`

#### addressVerification

> **addressVerification**: `boolean`

#### discountCodes

> **discountCodes**: `boolean`

#### memberships?

> `optional` **memberships?**: `object`

##### memberships.mixedCart

> **mixedCart**: `boolean`

##### memberships.oneTime

> **oneTime**: `boolean`

##### memberships.recurring

> **recurring**: `boolean`

#### shipping

> **shipping**: `boolean`

***

### currency

> **currency**: `"usd"`

***

### payments

> **payments**: `object`

#### cardEnabled

> **cardEnabled**: `boolean`

#### stripeConnectedAccountId

> **stripeConnectedAccountId**: `string` \| `null`

#### stripeEnvironment

> **stripeEnvironment**: [`StripeEnvironment`](../../generated/sales/type-aliases/StripeEnvironment.md)

#### stripePublishableKey

> **stripePublishableKey**: `string` \| `null`

***

### tenantId

> **tenantId**: `string`
