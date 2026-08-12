# Type Alias: ISalesEcommOrderResponse

> **ISalesEcommOrderResponse** = `object`

Defined in: src/generated/sales/types.gen.ts:126

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### buyer

> **buyer**: \{ `email`: `string`; `name`: `string`; `phone?`: `string` \| `null`; \} \| `null`

Defined in: src/generated/sales/types.gen.ts:130

***

### closedAt

> **closedAt**: `string` \| `null`

Defined in: src/generated/sales/types.gen.ts:154

***

### createdAt

> **createdAt**: `string`

Defined in: src/generated/sales/types.gen.ts:153

***

### fulfillment?

> `optional` **fulfillment?**: `object`

Defined in: src/generated/sales/types.gen.ts:136

#### recipient

> **recipient**: [`SalesFulfillmentOrderRecipient`](SalesFulfillmentOrderRecipient.md)

#### shippingPrice

> **shippingPrice**: `number` \| `null`

#### status

> **status**: `"pending"` \| `"processing"` \| `"shipped"` \| `"delivered"` \| `"exception"` \| `"canceled"` \| `null`

***

### id

> **id**: `string`

Defined in: src/generated/sales/types.gen.ts:127

***

### items

> **items**: [`ISalesEcommOrderItem`](../../generated/sales/type-aliases/ISalesEcommOrderItem.md)[]

Defined in: src/generated/sales/types.gen.ts:135

***

### payment?

> `optional` **payment?**: `object`

Defined in: src/generated/sales/types.gen.ts:148

#### brand?

> `optional` **brand?**: `string` \| `null`

#### last4?

> `optional` **last4?**: `string` \| `null`

#### status

> **status**: `"pending"` \| `"authorized"` \| `"captured"` \| `"failed"` \| `"canceled"`

***

### priceBase

> **priceBase**: `number`

Defined in: src/generated/sales/types.gen.ts:142

***

### priceDiscounted

> **priceDiscounted**: `number`

Defined in: src/generated/sales/types.gen.ts:141

***

### priceDue

> **priceDue**: `number`

Defined in: src/generated/sales/types.gen.ts:146

***

### pricePaid

> **pricePaid**: `number`

Defined in: src/generated/sales/types.gen.ts:145

***

### priceTax

> **priceTax**: `number`

Defined in: src/generated/sales/types.gen.ts:143

***

### priceTotal

> **priceTotal**: `number`

Defined in: src/generated/sales/types.gen.ts:144

***

### saleNumber

> **saleNumber**: `string`

Defined in: src/generated/sales/types.gen.ts:128

***

### status

> **status**: `"open"` \| `"payment_pending"` \| `"paid"` \| `"voided"`

Defined in: src/generated/sales/types.gen.ts:129

***

### taxes

> **taxes**: [`ISalesTabTaxLine`](../../generated/sales/type-aliases/ISalesTabTaxLine.md)[]

Defined in: src/generated/sales/types.gen.ts:147
