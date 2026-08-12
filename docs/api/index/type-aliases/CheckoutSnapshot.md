# Type Alias: CheckoutSnapshot

> **CheckoutSnapshot** = `object`

The render-safe state emitted by checkout. Capability secrets are never included.

## Properties

### isBusy

> **isBusy**: `boolean`

True while a checkout operation is in flight.

***

### lastError

> **lastError**: [`PublicError`](PublicError.md) \| `null`

Last checkout error safe to render in UI.

***

### order

> **order**: [`Order`](Order.md) \| `null`

Completed public order when available.

***

### paymentAttemptId

> **paymentAttemptId**: `string` \| `null`

Active payment attempt id while setup/recovery is tracked.

***

### paymentAttemptStatus

> **paymentAttemptStatus**: `string` \| `null`

Active payment attempt status while setup/recovery is tracked.
