# Type Alias: ISalesEcommOrderItem

> **ISalesEcommOrderItem** = `object`

## Properties

### effectivePrice

> **effectivePrice**: `number`

***

### id

> **id**: `string`

***

### lineAmountBase?

> `optional` **lineAmountBase?**: `number`

***

### lineAmountTax?

> `optional` **lineAmountTax?**: `number`

***

### membership?

> `optional` **membership?**: `object`

#### id

> **id**: `string` \| `null`

#### status

> **status**: `"pending"` \| `"active"` \| `"paused"` \| `"suspended"` \| `"terminated"`

#### terms

> **terms**: [`ISalesMembershipCheckoutTerms`](../../../index/type-aliases/ISalesMembershipCheckoutTerms.md)

***

### notes

> **notes**: `string` \| `null`

***

### priceBase

> **priceBase**: `number`

***

### priceGroups?

> `optional` **priceGroups?**: `object`[]

#### kind

> **kind**: `"fullPrice"` \| `"reward"`

#### lineAmount

> **lineAmount**: `number`

#### qty

> **qty**: `number`

#### unitPrice

> **unitPrice**: `number`

***

### priceOverride?

> `optional` **priceOverride?**: [`ISalesEcommPublicPriceOverride`](ISalesEcommPublicPriceOverride.md)

***

### priceTax

> **priceTax**: `number`

***

### priceTotal

> **priceTotal**: `number`

***

### product

> **product**: `object`

#### id

> **id**: `string`

#### name

> **name**: `string`

#### price

> **price**: `number`

#### type

> **type**: `string`

***

### promotionName?

> `optional` **promotionName?**: `string`

***

### qty

> **qty**: `number`
