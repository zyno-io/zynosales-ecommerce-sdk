# Type Alias: ISalesEcommPublicCart

> **ISalesEcommPublicCart** = `object`

Defined in: src/generated/sales/types.gen.ts:198

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### appliedDiscount?

> `optional` **appliedDiscount?**: [`ISalesEcommAppliedDiscount`](../../generated/sales/type-aliases/ISalesEcommAppliedDiscount.md)

Defined in: src/generated/sales/types.gen.ts:209

***

### closedAt

> **closedAt**: `string` \| `null`

Defined in: src/generated/sales/types.gen.ts:220

***

### createdAt

> **createdAt**: `string`

Defined in: src/generated/sales/types.gen.ts:218

***

### fulfillment?

> `optional` **fulfillment?**: `object`

Defined in: src/generated/sales/types.gen.ts:203

#### recipient

> **recipient**: [`SalesFulfillmentOrderRecipient`](SalesFulfillmentOrderRecipient.md)

#### shippingPlan?

> `optional` **shippingPlan?**: [`ISalesEcommPublicShippingPlan`](../../generated/sales/type-aliases/ISalesEcommPublicShippingPlan.md)

#### shippingPlanId

> **shippingPlanId**: `string` \| `null`

#### shippingPrice

> **shippingPrice**: `number` \| `null`

***

### id

> **id**: `string`

Defined in: src/generated/sales/types.gen.ts:199

***

### items

> **items**: [`ISalesEcommPublicCartItem`](../../generated/sales/type-aliases/ISalesEcommPublicCartItem.md)[]

Defined in: src/generated/sales/types.gen.ts:202

***

### priceBase

> **priceBase**: `number`

Defined in: src/generated/sales/types.gen.ts:212

***

### priceDiscounted

> **priceDiscounted**: `number`

Defined in: src/generated/sales/types.gen.ts:211

***

### priceDue

> **priceDue**: `number`

Defined in: src/generated/sales/types.gen.ts:215

***

### priceOverride?

> `optional` **priceOverride?**: [`ISalesEcommPublicPriceOverride`](../../generated/sales/type-aliases/ISalesEcommPublicPriceOverride.md)

Defined in: src/generated/sales/types.gen.ts:210

***

### priceTax

> **priceTax**: `number`

Defined in: src/generated/sales/types.gen.ts:213

***

### priceTotal

> **priceTotal**: `number`

Defined in: src/generated/sales/types.gen.ts:214

***

### saleNumber

> **saleNumber**: `string`

Defined in: src/generated/sales/types.gen.ts:200

***

### status

> **status**: `"open"` \| `"closed"` \| `"voided"` \| `"saved"` \| `"archived"` \| `"deleted"`

Defined in: src/generated/sales/types.gen.ts:201

***

### taxes

> **taxes**: [`ISalesTabTaxLine`](../../generated/sales/type-aliases/ISalesTabTaxLine.md)[]

Defined in: src/generated/sales/types.gen.ts:216

***

### taxStatus

> **taxStatus**: `"ok"` \| `"unresolved"` \| `"failed"`

Defined in: src/generated/sales/types.gen.ts:217

***

### updatedAt

> **updatedAt**: `string`

Defined in: src/generated/sales/types.gen.ts:219
