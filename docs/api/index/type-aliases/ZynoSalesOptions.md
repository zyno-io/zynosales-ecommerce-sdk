# Type Alias: ZynoSalesOptions

> **ZynoSalesOptions** = [`ZynoSalesSharedOptions`](ZynoSalesSharedOptions.md) & \{ `apiBase?`: `never`; `environment?`: `ZynoSalesEnvironment`; \} \| \{ `apiBase`: `string`; `environment?`: `never`; \}

Creates an SDK instance using a built-in Sales endpoint or an explicit API base.

Provide either a built-in `environment` or an explicit `apiBase`. The two
options are mutually exclusive. Non-local bases must use HTTPS.
