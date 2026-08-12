# Type Alias: ISalesEcommStoreProduct

> **ISalesEcommStoreProduct** = `object`

Generated browser-facing Sales contract types for advanced integrations.

## Properties

### description

> **description**: `string`

***

### id

> **id**: `string`

***

### images

> **images**: [`ISalesEcommProductImage`](../../generated/sales/type-aliases/ISalesEcommProductImage.md)[]

***

### name

> **name**: `string`

***

### price

> **price**: `number`

***

### shippingMeta?

> `optional` **shippingMeta?**: [`ISalesFulfillmentProductShippingMeta`](../../generated/sales/type-aliases/ISalesFulfillmentProductShippingMeta.md)

***

### slug

> **slug**: `string`

***

### type

> **type**: `"standard"` \| `"variant"`

***

### variant?

> `optional` **variant?**: `object`

#### groupId

> **groupId**: `string`

#### groupName

> **groupName**: `string`

#### groupSlug

> **groupSlug**: `string`

#### options

> **options**: [`ISalesEcommVariantOptionDefinition`](../../generated/sales/type-aliases/ISalesEcommVariantOptionDefinition.md)[]

#### values

> **values**: [`Record4`](../../generated/sales/type-aliases/Record4.md)
