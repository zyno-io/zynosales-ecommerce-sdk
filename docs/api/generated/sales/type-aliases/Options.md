# Type Alias: Options\<TData, ThrowOnError, TResponse\>

> **Options**\<`TData`, `ThrowOnError`, `TResponse`\> = `Options2`\<`TData`, `ThrowOnError`, `TResponse`\> & `object`

## Type Declaration

### client?

> `optional` **client?**: `Client`

You can provide a client instance returned by `createClient()` instead of
individual options. This might be also useful if you want to implement a
custom client.

### meta?

> `optional` **meta?**: keyof `ClientMeta` *extends* `never` ? `Record`\<`string`, `unknown`\> : `ClientMeta`

You can pass arbitrary values through the `meta` object. This can be
used to access values that aren't defined as part of the SDK function.

## Type Parameters

### TData

`TData` *extends* `TDataShape` = `TDataShape`

### ThrowOnError

`ThrowOnError` *extends* `boolean` = `boolean`

### TResponse

`TResponse` = `unknown`
