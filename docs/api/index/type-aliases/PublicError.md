# Type Alias: PublicError

> **PublicError** = `object`

A render-safe representation of an SDK error.

## Properties

### kind

> **kind**: `"api"` \| `"capability-lost"` \| `"network"`

- `network`: transport failure; local capability is usually retained
- `capability-lost`: cart/order capability is no longer valid
- `api`: validated business or request error

***

### message

> **message**: `string`

Display-safe message suitable for checkout UI.

***

### status?

> `optional` **status?**: `number`

HTTP status when a response was received.
