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

#### pinnedBuyer

> **pinnedBuyer**: `boolean`

#### shipping

> **shipping**: `boolean`

***

### currency

> **currency**: `"usd"`

***

### customerAuth

> **customerAuth**: `object`

#### enabled

> **enabled**: `boolean`

#### options

> **options**: [`ISalesEcommCustomerAuthOptions`](ISalesEcommCustomerAuthOptions.md) \| `null`

#### orderHistoryConfigRevision

> **orderHistoryConfigRevision**: `number`

#### orderHistoryScope

> **orderHistoryScope**: `"ecomm"` \| `"all"`

#### passwordRequirements

> **passwordRequirements**: `object`

##### passwordRequirements.maximumLength

> **maximumLength**: `number`

##### passwordRequirements.minimumCharacterClasses

> **minimumCharacterClasses**: `number`

##### passwordRequirements.minimumLength

> **minimumLength**: `number`

#### policyId

> **policyId**: `string` \| `null`

#### policyRevision

> **policyRevision**: `number` \| `null`

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
