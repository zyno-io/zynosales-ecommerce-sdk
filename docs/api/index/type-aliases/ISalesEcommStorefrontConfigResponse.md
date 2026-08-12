# Type Alias: ISalesEcommStorefrontConfigResponse

> **ISalesEcommStorefrontConfigResponse** = `object`

Defined in: src/generated/sales/types.gen.ts:162

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### capabilities

> **capabilities**: `object`

Defined in: src/generated/sales/types.gen.ts:171

#### addressVerification

> **addressVerification**: `boolean`

#### discountCodes

> **discountCodes**: `boolean`

#### shipping

> **shipping**: `boolean`

***

### currency

> **currency**: `"usd"`

Defined in: src/generated/sales/types.gen.ts:164

***

### payments

> **payments**: `object`

Defined in: src/generated/sales/types.gen.ts:165

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

Defined in: src/generated/sales/types.gen.ts:163
