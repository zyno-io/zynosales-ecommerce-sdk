# Type Alias: ISalesEcommPublicCart

> **ISalesEcommPublicCart** = `object`

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### appliedDiscount?

> `optional` **appliedDiscount?**: [`ISalesEcommAppliedDiscount`](../../generated/sales/type-aliases/ISalesEcommAppliedDiscount.md)

***

### closedAt

> **closedAt**: `string` \| `null`

***

### createdAt

> **createdAt**: `string`

***

### fulfillment?

> `optional` **fulfillment?**: `object`

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

***

### items

> **items**: [`ISalesEcommPublicCartItem`](../../generated/sales/type-aliases/ISalesEcommPublicCartItem.md)[]

***

### priceBase

> **priceBase**: `number`

***

### priceDiscounted

> **priceDiscounted**: `number`

***

### priceDue

> **priceDue**: `number`

***

### priceOverride?

> `optional` **priceOverride?**: [`ISalesEcommPublicPriceOverride`](../../generated/sales/type-aliases/ISalesEcommPublicPriceOverride.md)

***

### priceTax

> **priceTax**: `number`

***

### priceTotal

> **priceTotal**: `number`

***

### saleNumber

> **saleNumber**: `string`

***

### status

> **status**: `"open"` \| `"closed"` \| `"voided"` \| `"saved"` \| `"archived"` \| `"deleted"`

***

### taxes

> **taxes**: [`ISalesTabTaxLine`](../../generated/sales/type-aliases/ISalesTabTaxLine.md)[]

***

### taxStatus

> **taxStatus**: `"ok"` \| `"unresolved"` \| `"failed"`

***

### updatedAt

> **updatedAt**: `string`
