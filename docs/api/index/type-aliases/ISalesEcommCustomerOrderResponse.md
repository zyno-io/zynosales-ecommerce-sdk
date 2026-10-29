# Type Alias: ISalesEcommCustomerOrderResponse

> **ISalesEcommCustomerOrderResponse** = `object`

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### closedAt

> **closedAt**: `string` \| `null`

***

### createdAt

> **createdAt**: `string`

***

### fulfillmentStatus

> **fulfillmentStatus**: `"pending"` \| `"processing"` \| `"shipped"` \| `"delivered"` \| `"exception"` \| `"canceled"` \| `null`

***

### id

> **id**: `string`

***

### items

> **items**: [`ISalesEcommCustomerOrderItem`](../../generated/sales/type-aliases/ISalesEcommCustomerOrderItem.md)[]

***

### paymentStatus

> **paymentStatus**: `"pending"` \| `"authorized"` \| `"captured"` \| `"failed"` \| `"canceled"` \| `null`

***

### saleNumber

> **saleNumber**: `string`

***

### source

> **source**: `"salespoint"` \| `"subscription"` \| `"ecomm"` \| `"stripeCheckout"` \| `"billing"` \| `"external"`

***

### status

> **status**: `"open"` \| `"payment_pending"` \| `"paid"` \| `"voided"`

***

### totals

> **totals**: `object`

#### base

> **base**: `number`

#### discounted

> **discounted**: `number`

#### due

> **due**: `number`

#### paid

> **paid**: `number`

#### tax

> **tax**: `number`

#### total

> **total**: `number`
