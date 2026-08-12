# Type Alias: CartServerAccess

> **CartServerAccess** = `object`

A one-call, privileged cart reference for a trusted merchant server request.
Treat as a secret: never put in URLs, logs, analytics, or render state.

## Properties

### cartId

> **cartId**: `string`

Sales cart id.

***

### cartKey

> **cartKey**: `string`

Transient cart capability for the merchant server only.
