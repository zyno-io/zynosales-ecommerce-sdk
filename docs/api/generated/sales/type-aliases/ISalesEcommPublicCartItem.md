# Type Alias: ISalesEcommPublicCartItem

> **ISalesEcommPublicCartItem** = `object`

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

> `optional` **membership?**: [`ISalesMembershipCheckoutTerms`](../../../index/type-aliases/ISalesMembershipCheckoutTerms.md)

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

> **product**: [`PickISalesTabItemProduct`](PickISalesTabItemProduct.md)

***

### promotionName?

> `optional` **promotionName?**: `string`

***

### qty

> **qty**: `number`

***

### selectionId?

> `optional` **selectionId?**: `string`
