# Type Alias: ISalesEcommOrderItem

> **ISalesEcommOrderItem** = `object`

## Properties

### automaticPromotionName?

> `optional` **automaticPromotionName?**: `string`

***

### effectivePrice

> **effectivePrice**: `number`

***

### id

> **id**: `string`

***

### lineAmountBase?

> `optional` **lineAmountBase?**: `number` \| `null`

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

> `optional` **priceGroups?**: [`ISalesEcommPromotionPriceGroup`](ISalesEcommPromotionPriceGroup.md)[]

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

### qty

> **qty**: `number`
