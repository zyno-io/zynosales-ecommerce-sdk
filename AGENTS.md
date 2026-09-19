# ZynoSales eCommerce SDK

## Scope

- Keep this package framework-neutral, ESM-only, and limited to commerce APIs.
  Integrators own rendering, routing, CSS, Stripe Elements, and merchant-specific
  services.
- Sales is authoritative for catalog availability, prices, taxes, discounts,
  shipping, payment state, and orders. Do not reproduce those rules or totals in
  the SDK.

## Contracts and generated code

- The browser-facing storefront contract is owned by the ZynoSales API server.
  Do not move it into `zyno-shared` or duplicate its types by hand in this
  package.
- Include only embedded, browser-safe Sales operations. To add an operation,
  update the Sales contract first, then keep the allowlists in
  `openapi-specs.json`, `openapi-specs.dev.json`, and
  `test/openapi-contract.test.ts` synchronized before regenerating the client
  with `yarn openapi:generate`.
- `src/generated/sales/` is generated output. Do not edit it directly.

## Documentation

- Keep `docs/guide/` authored, product-generic integration documentation. Do
  not add merchant-specific migration material, deployment details, or private
  source references.
- `docs/api/` is generated from the public TypeScript entry points and TSDoc.
  Do not edit it directly; run `yarn docs:api` after changing exported APIs or
  their documentation. `yarn docs:build` regenerates it before building the
  VitePress site.
- `.working/` is ignored local scratch and reference material. Do not commit it
  or make source code, tests, generated contracts, or published documentation
  depend on its contents.

## Security and state invariants

- Treat cart keys, order keys, Stripe client secrets, buyer PII, and fulfillment
  details as secrets. Keep them out of snapshots, URLs, logs, analytics,
  diagnostics, and display-safe errors.
- Send cart and order capabilities only in the required Sales request headers.
  A cart key may be exposed only through the explicit trusted-server handoff;
  it must remain transient and same-origin.
- Preserve serialized cart mutations, server-authoritative cart replacement,
  payment-attempt invalidation after cart changes, and stale-capability cleanup.
