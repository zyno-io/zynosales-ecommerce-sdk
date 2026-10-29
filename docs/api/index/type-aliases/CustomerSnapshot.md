# Type Alias: CustomerSnapshot

> **CustomerSnapshot** = `object`

Render-safe customer state. Opaque session secrets, passwords, codes, and proofs are excluded.

## Properties

### authenticatedAt

> **authenticatedAt**: `string` \| `null`

***

### authenticationMethod

> **authenticationMethod**: `"password"` \| `"otp"` \| `null`

***

### availableActions

> **availableActions**: `string`[]

***

### expiresAt

> **expiresAt**: `string` \| `null`

***

### idleExpiresAt

> **idleExpiresAt**: `string` \| `null`

***

### isBusy

> **isBusy**: `boolean`

***

### lastError

> **lastError**: [`PublicError`](PublicError.md) \| `null`

***

### options

> **options**: [`ISalesEcommCustomerAuthOptions`](ISalesEcommCustomerAuthOptions.md) \| `null`

***

### orderHistoryScope

> **orderHistoryScope**: `"ecomm"` \| `"all"` \| `null`

***

### persistence

> **persistence**: `"session"` \| `"local"` \| `"memory"` \| `"custom"`

***

### policyDigest

> **policyDigest**: `string` \| `null`

***

### policyId

> **policyId**: `string` \| `null`

***

### policyRevision

> **policyRevision**: `number` \| `null`

***

### state

> **state**: `"uninitialized"` \| `"anonymous"` \| `"authenticated"` \| `"cart-resume"` \| `"restricted"` \| `"expired"`
