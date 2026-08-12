# Type Alias: ISalesEcommOrderResponse

> **ISalesEcommOrderResponse** = `object`

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### buyer

> **buyer**: \{ `email`: `string`; `name`: `string`; `phone?`: `string` \| `null`; \} \| `null`

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

#### shippingPrice

> **shippingPrice**: `number` \| `null`

#### status

> **status**: `"pending"` \| `"processing"` \| `"shipped"` \| `"delivered"` \| `"exception"` \| `"canceled"` \| `null`

***

### id

> **id**: `string`

***

### items

> **items**: [`ISalesEcommOrderItem`](../../generated/sales/type-aliases/ISalesEcommOrderItem.md)[]

***

### payment?

> `optional` **payment?**: `object`

#### brand?

> `optional` **brand?**: `string` \| `null`

#### last4?

> `optional` **last4?**: `string` \| `null`

#### status

> **status**: `"pending"` \| `"authorized"` \| `"captured"` \| `"failed"` \| `"canceled"`

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

### pricePaid

> **pricePaid**: `number`

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

> **status**: `"open"` \| `"payment_pending"` \| `"paid"` \| `"voided"`

***

### taxes

> **taxes**: [`ISalesTabTaxLine`](../../generated/sales/type-aliases/ISalesTabTaxLine.md)[]
