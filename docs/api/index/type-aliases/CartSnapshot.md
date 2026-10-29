# Type Alias: CartSnapshot

> **CartSnapshot** = `object`

The render-safe state emitted by the cart session. Capability secrets are never included.

## Properties

### cart

> **cart**: [`Cart`](Cart.md) \| `null`

Last loaded authoritative cart, or `null` before restore.

***

### customerPolicy

> **customerPolicy**: \{ `orderHistoryScope`: `"ecomm"` \| `"all"`; `policyId`: `string`; `policyRevision`: `number`; \} \| `null`

Safe account policy identifiers for an account-bound cart.

***

### hasCart

> **hasCart**: `boolean`

Whether a persisted cart capability currently exists.

***

### isBusy

> **isBusy**: `boolean`

True while a cart restore or mutation is in flight.

***

### lastError

> **lastError**: [`PublicError`](PublicError.md) \| `null`

Last cart error safe to render in UI.

***

### mode

> **mode**: `"guest"` \| `"account"` \| `null`

Safe persisted checkout mode, used to choose guest versus customer recovery.
