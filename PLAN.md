# ZynoSales eCommerce SDK — V1 Plan

## V1 definition

V1 is a single, publishable, framework-neutral TypeScript package exposing
JavaScript APIs only. It will include no Web Components, React/Vue bindings,
CSS, routing, or checkout markup. The SDK owns commerce behavior; integrating
websites own presentation and customer experience.

The repository will live at `../zynosales-ecommerce-sdk` and publish as
`@zyno-io/zynosales-ecommerce-sdk`.

## Repository structure

```text
zynosales-ecommerce-sdk/
  src/
    generated/sales/       Generated embedded-storefront OpenAPI types/client
    configuration/         Built-in API-base resolution and runtime config cache
    transport/             Fetch, headers, errors, redaction
    catalog/               Catalog cache and modifier-selection helpers
    cart/                  Capability persistence, state, serialized mutations
    checkout/              Buyer, shipping, discounts, payments, recovery
    hooks/                 Typed merchant lifecycle hooks
    index.ts               Public package surface
  test/
    unit/
    contract/
    integration/
  examples/
    vanilla-storefront/    API-only reference integration
  docs/
    .vitepress/            VitePress configuration, theme, and deployment config
    guide/                 Authored, user-facing integration documentation
    api/                   Raw generated SDK API documentation; never hand-edit
    index.md                Landing page linking only to Guide and SDK API
  openapi-specs.json
  openapi-specs.dev.json  Local-development source override; not published
  .working/                Ignored local reference material and migration notes
  .gitignore
```

The initial package will publish ESM and declarations. CommonJS support is
deferred unless an intended consuming site requires it.

`docs/` is a publishable VitePress site with exactly two navigable sections:

1. **Guide** (`docs/guide/`) is authored, user-facing documentation:
   installation, configuration, cart and checkout flows, Stripe
   connected-account setup, modifier usage, server-handoff security, and
   framework-neutral examples.
2. **SDK API** (`docs/api/`) is raw documentation generated from the public
   TypeScript source. It is a complete, machine-generated reference rather
   than an authored restatement of the Guide.

The landing page links only to those two sections. All publishable content is
product-generic; it must contain no client-, merchant-, or deployment-specific
references, migration pages, screenshots, terminology, or source links.

`.working/` is deliberately ignored by Git and is the home for local reference
material that should not be published with the SDK. This includes the private
first-consumer transition plan and any local notes or comparison material used
while validating the migration. No source, generated contract, test fixture, or
published documentation may depend on a file in `.working/`.

### Generated SDK documentation pipeline

The SDK API section is generated from TSDoc comments and declarations on the
package's exported public surface (`src/index.ts` and its intentionally
exported types). A TypeDoc Markdown generator writes its raw output directly
to `docs/api/`; VitePress renders it without hand-authored wrapper pages or
duplicated method documentation. Generated pages are not edited by hand.
Guide pages link to API symbols instead of copying method signatures, which
keeps the Guide readable while preventing reference drift.

The package scripts and CI responsibilities are:

1. `docs:api` clears and regenerates only `docs/api/` from the public
   entrypoint, including API signatures, parameter/return documentation,
   errors, lifecycle hook context, configuration types, and generated-contract
   types intentionally re-exported to consumers.
2. `docs:dev` starts VitePress after running the API-doc generation step.
3. `docs:build` runs `docs:api` and then performs the VitePress production
   build. The build output is deployable static content, not part of the npm
   package.
4. CI regenerates API docs and fails if the generated reference has an
   uncommitted diff, then runs the VitePress build and link checker. This makes
   undocumented or stale public APIs a review failure.

The generated reference describes the SDK facade and its public types, not the
raw OpenAPI client's internal operation methods. The latter remains an
implementation detail; the selected-operation manifest and generated contract
are validated in the code-generation pipeline instead.

## Contract ownership and generation

The ZynoSales API server owns the browser-facing contract. This SDK will
generate its types/client from the embedded storefront operations in
`zynosales-api-server/openapi.yaml`; it will not duplicate Sales contracts or
add them to `zyno-shared`.

The OpenAPI generator will be configured to copy and generate **only** the
embedded storefront operations needed by this package. It must not consume the
entire Sales specification or generate admin, internal, public compatibility,
or `OPTIONS` operations.

`openapi-specs.json` is the committed contract manifest: it names the generated
output path and the exact operation IDs below. For local SDK development,
`openapi-specs.dev.json` points that manifest at
`../zynosales-api-server/openapi.yaml`. The generator's selected-operation
copying feature will copy just those operations plus their transitive schema
references into the SDK contract input before generating code. This keeps the
SDK reviewable and prevents unrelated API changes from becoming SDK surface
area. The complete Sales YAML is neither committed to nor generated by this
repository.

The initial selected operation IDs are:

- `getSalesEcommStorefrontConfigEmbeddedGet`
- `getSalesEcommProductsEmbeddedIndex` and
  `getSalesEcommProductsEmbeddedShow`
- `postSalesEcommCheckoutEmbeddedCreateCart`,
  `getSalesEcommCheckoutEmbeddedGetCart`,
  `putSalesEcommCheckoutEmbeddedReplaceItems`, and
  `deleteSalesEcommCheckoutEmbeddedAbandonCart`
- `putSalesEcommCheckoutEmbeddedUpdateBuyer` and
  `postSalesEcommCheckoutEmbeddedVerifyAddress`
- `postSalesEcommCheckoutEmbeddedCalculateShippingRates`,
  `postSalesEcommCheckoutEmbeddedQuoteShippingSelection`,
  `putSalesEcommCheckoutEmbeddedUpdateFulfillment`, and
  `deleteSalesEcommCheckoutEmbeddedRemoveFulfillment`
- `postSalesDiscountCodesEmbeddedValidate`,
  `postSalesEcommCheckoutEmbeddedApplyDiscountCode`, and
  `deleteSalesEcommCheckoutEmbeddedRemoveDiscountCode`
- `postSalesEcommCheckoutEmbeddedSetupCardPayment`,
  `getSalesEcommCheckoutEmbeddedGetPaymentAttempt`,
  `deleteSalesEcommCheckoutEmbeddedCancelPaymentAttempt`,
  `postSalesEcommCheckoutEmbeddedConfirmCardPayment`, and
  `postSalesEcommCheckoutEmbeddedFinalizeZeroDueCart`
- `getSalesEcommOrdersEmbeddedGet`

Modifier operation IDs are deliberately not guessed. They will be added to
this list only when the Sales server publishes the corresponding embedded
browser contract (see “Catalog and modifiers”).

The capabilities covered by the selected operations are:

- Storefront configuration, product index, and product detail
- Cart create/read/replace/abandon
- Buyer, address validation, fulfillment, shipping rates, and selection quote
- Discount validation/application/removal
- Card-payment setup, attempt read/cancel, confirmation, and zero-due finalization
- Order read by order capability

The repository will retain generated type output and an OpenAPI contract
manifest containing the selected operation IDs and filtered-source hash. CI
regenerates from the filtered source and fails on an unexpected diff. A
contract test also asserts that no operation outside the allowlist is emitted.

## Endpoint selection and runtime storefront configuration

The SDK embeds the canonical Sales bases so an integrating website needs only a
publishable key in normal use:

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...'
}); // production: https://sales.api.zyno.app

const alphaStorefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    environment: 'alpha'
}); // https://sales.api-alpha.zyno.dev
```

`environment` is optional and supports `production` (the default) and `alpha`.
An `apiBase` override remains available for local development, tests, or a
future approved deployment topology, but it is never required for production
or alpha integrations. The constructor type will make `environment` and an
explicit `apiBase` mutually exclusive, so base selection cannot be ambiguous.
The SDK normalizes the selected base once, refuses malformed bases, and keeps
storage isolated by base/environment and storefront identity to prevent an
alpha cart from being restored on production.

At startup the SDK calls the generated storefront-config operation. That
response—not a value embedded in the website build—is the authority for
browser-safe merchant runtime configuration: payment availability, Stripe
publishable key and connected account, capabilities, and future documented
flags. `getConfig()` returns the cached value and `refreshConfig()` explicitly
refetches it; the plan does not rely on a deploy to change a live site's
checkout configuration.

If Sales needs more runtime configurability, it will extend the browser-facing
config schema with versioned, documented, browser-safe fields. The SDK will
expose those generated fields or typed adapters for them; it will not accept an
unbounded arbitrary options blob and it will never surface credentials, secret
keys, or server-only policy.

## Public API layers

`createZynoSales()` is the normal public facade: it composes one low-level
client, the cart session, checkout coordinator, and configured hooks. The
lower-level `createZynoSalesClient()` is a separately exported escape hatch for
advanced hosts that need a single generated operation without SDK-managed cart
state. Both use the same endpoint resolution and generated contract.

### 1. Stateless API client

```ts
const client = createZynoSalesClient({
    publishableKey,
    environment: 'alpha', // optional; production is the default
    fetch
});

await client.getConfig();
await client.getProducts();
await client.createCart({ items });
await client.updateFulfillment(cartReference, fulfillment);
```

Responsibilities:

- Inject `X-ZS-Publishable-Key`
- Send cart/order capabilities only in required HTTP headers
- Encode route parameters and support `AbortSignal`
- Normalize failures into safe typed errors
- Never log request bodies, PII, capability keys, or payment secrets
- Support injected `fetch` for SSR and tests

### 2. Cart session

```ts
const cart = storefront.cart;

await cart.restore();
await cart.add({ productId, qty: 1, notes: 'Gift wrap' });
await cart.setQuantity({ cartItemId, qty: 2 });
await cart.remove({ cartItemId });

const unsubscribe = cart.subscribe(snapshot => render(snapshot));
```

Responsibilities:

- Persist `{ cartId, cartKey, orderKey }` before exposing a newly created cart
- Keep those capabilities out of subscription state and events
- Serialize concurrent mutations so overlapping updates cannot overwrite each other
- Replace local state only with authoritative server cart responses
- Abandon a cart rather than submitting an empty item list
- Clear stale storage after a lost capability/404
- Accept custom storage for hosts with different browser-storage policies

Subscription snapshots contain render-safe data only:

```ts
type CartSnapshot = {
    cart: Cart | null;
    hasCart: boolean;
    isBusy: boolean;
    lastError: PublicError | null;
};
```

### 3. Checkout coordinator

```ts
await checkout.setBuyer({ name, email, phone });

const verification = await checkout.verifyAddress(address);
const rates = await checkout.getShippingRates({ address: selectedAddress });
const quote = await checkout.quoteShippingSelection({ shippingPlanId, packageRates });

await checkout.setFulfillment({ recipient, shippingPlanId, packageRates });
await checkout.applyDiscount({ code: 'WELCOME' });

const payment = await checkout.beginCardPayment();
```

The checkout coordinator provides independent state transitions rather than a
prescribed screen flow. Websites decide their own UI sequence and validation
copy. Its snapshots include selected address, shipping plan, order, payment
attempt status, busy state, and safe errors—never cart capabilities or Stripe
client secrets.

## Catalog and modifiers

V1 has **modifiers, not variants**. The SDK will not create a variant domain
model, variant grouping helpers, or a Cartesian-product selector. A shopper
selects modifier groups and options for the product they are buying; the
backend remains authoritative for availability, required/minimum/maximum
selection rules, price adjustments, and the resulting cart line.

The current embedded storefront contract must first be audited for two complete
capabilities:

1. Product responses expose modifier groups/options and every customer-visible
   selection constraint.
2. Cart item inputs accept modifier selections and returned cart lines carry
   the authoritative resolved selections and prices.

If either is absent, adding those embedded browser-facing endpoints/schemas to
the Sales API server is a V1 prerequisite. Those contracts remain owned by the
Sales server, then their exact operation IDs are added to the OpenAPI allowlist
above and generated into this package. The SDK will not invent local modifier
types or manually duplicate the request shape.

Once the contract exists, the SDK semantic layer will provide catalog reads and
selection helpers such as `getModifierGroups(product)` and
`validateModifierSelection(product, selections)`, plus cart methods that accept
the generated modifier-selection input:

```ts
await storefront.cart.add({
    productId,
    qty: 1,
    modifiers: selections
});
```

Client validation is advisory and improves UI feedback only. It cannot make a
selection purchasable or calculate a final price; every add/replace response
replaces local cart state with the server's resolved line items and totals.
Catalog caching is explicit and configurable rather than an opaque long-lived
cache.

## Checkout behavior

### Buyer, address, and fulfillment

Buyer identity remains separate from the shipping recipient. Address
verification is stateless: the SDK returns normalization candidates and issues,
while the website decides whether to use them. It must never silently replace a
shopper-entered address.

### Shipping

The SDK will request backend shipping rates, expose customer-safe rate options,
quote the full selected package combination, and apply fulfillment. It will
never sum independent package prices client-side; the backend selection quote
is authoritative for multi-package totals.

### Discounts and totals

`validateDiscount` is available for optional previews. `applyDiscount` and
`removeDiscount` update the cart. All money is minor-unit currency values and
all displayed totals must come from the returned backend cart/order state.

## Payments, idempotency, and recovery

The SDK will not accept card data or depend directly on `@stripe/stripe-js`.
It returns the runtime-configured browser-safe Stripe values and a payment
setup response:

```ts
type CardPaymentSetup = {
    paymentAttemptId: string;
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
};
```

The website mounts and uses its own Stripe Elements integration, then calls
`checkout.completeCardPayment(...)` after authorization.

The payment guide and local integration reference will require
connected-account handling when configuring Stripe. The backend configuration
is the only source of this choice:

```ts
const config = await storefront.getConfig();
const payments = config.payments;

const stripe = payments.stripeConnectedAccountId
    ? await loadStripe(payments.stripePublishableKey!, {
        stripeAccount: payments.stripeConnectedAccountId
    })
    : await loadStripe(payments.stripePublishableKey!);
```

This is called only when `cardEnabled` and a publishable key are present. If
the backend provides a connected-account ID, the Stripe SDK **must** receive it
as `stripeAccount`; if the backend does not provide one, no `stripeAccount`
option is sent. The SDK does not guess an account from its environment or
merchant identity.

Required recovery behavior:

1. Generate and persist an idempotency UUID before payment setup.
2. Reuse it only for a retry of the same unchanged cart after a setup timeout.
3. Persist payment attempt/intent IDs before asking Stripe to confirm.
4. Treat cart, buyer, fulfillment, and discount changes as invalidating the
   active payment attempt.
5. `recoverPayment()` after a reload or payment return must either confirm the
   same authorized attempt, report a pending state, or clear canceled/failed
   state. It must never create a second payment attempt during recovery.
6. When `priceDue === 0`, bypass Stripe, finalize the cart, read the order with
   the order capability, and clear cart state.

## Merchant extension hooks

The core remains generic. Merchant behavior is supplied through hooks:

```ts
createZynoSales({
    hooks: {
        async beforePayment(context) {},
        async afterOrderCompleted(order) {},
        onCartChanged(snapshot) {}
    }
});
```

`beforePayment` runs after the shopper’s final mutation and immediately before
payment setup or zero-due finalization. If the hook changes backend cart state,
the SDK refreshes the cart before continuing.

### Privileged server handoff

Some merchant-owned server work has to act on the open cart. The SDK will make
the necessary reference available without putting a bearer capability in
render-safe state or a general event payload. An explicitly opted-in,
same-origin `beforePayment` hook receives a one-call `cartAccess` handoff:

```ts
async beforePayment({ cart, cartAccess }) {
    await fetch('/api/store/enrich-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cartId: cartAccess.cartId,
            cartKey: cartAccess.cartKey,
            jwt: merchantSession.jwt,
            addressId: selectedCrmAddressId ?? undefined
        })
    });
}
```

The exact public name is finalized during API design, but this is a deliberate
privileged API—not an accidental escape through `CartSnapshot`. It provides the
open-cart `cartId` and `cartKey` required by a host's current server-side cart
enrichment route; the order reference/capability is available separately only
to the lifecycle code that genuinely needs it. The SDK must never include either
capability in snapshots, analytics, URLs, diagnostic metadata, or untrusted
hook contexts.

The host is responsible for sending the handoff directly to its trusted
same-origin server over HTTPS. Its server must validate its own session/JWT,
re-derive fraud or eligibility decisions rather than trust browser assertions,
and neither log nor persist the cart key. The hook is awaited: a rejection
blocks payment setup/finalization, and an intentional cart mutation causes the
SDK to re-read the authoritative cart before continuing. This preserves the
ordering required to stamp a fraud verdict before a payment can close the cart.

After order completion, a non-privileged hook receives the resolved order and
the order/cart identifiers needed for merchant follow-up. A host can use it for
best-effort receipt and account-provisioning requests while keeping its JWT
validation and downstream policy on its own server.

Host-owned fraud enrichment, receipt delivery, account provisioning, and
customer lookup remain host services or hooks. Purchase-history eligibility
rules such as “customer must have purchased X before purchasing Y” are
explicitly out of scope for this SDK V1: they receive no hook abstraction, no
client enforcement, no migration, and no backend design work in this project.

## Security and error model

The publishable key is browser-safe. Cart and order keys are bearer
capabilities and require stricter handling:

- Store and transmit them only as necessary.
- Use headers only for API transport.
- Do not put them in URLs, analytics, error reporting, or event snapshots.
- Redact them, client secrets, payment IDs where appropriate, buyer PII, and
  fulfillment details from SDK-generated diagnostics.
- Expose a cart key to merchant code only through the explicit server-handoff
  callback; document it as transient, same-origin-only, and never loggable.

Errors distinguish network failure, API validation failure, stale capability,
checkout-state conflict, and payment-recovery status. Actionable 4xx messages
may be presented to a shopper; 5xx response details are replaced with generic
safe messages.

## Testing strategy

### Unit tests

- Header injection, URL encoding, and redaction
- Production-default, alpha, and explicit API-base resolution and storage
  namespace isolation
- Runtime config caching/refresh and browser-safe configuration projection
- Cart persistence ordering and stale-capability cleanup
- Serialized concurrent cart updates
- Modifier selection validation and authoritative cart-line reconciliation
- Shipping response normalization and multi-package quote handling
- Idempotency-key behavior and cart mutation invalidation
- Authorized, failed, canceled, pending, and zero-due payment transitions
- Connected-account Stripe option construction: send `stripeAccount` only when
  the runtime configuration provides it
- Privileged server-handoff containment: available to the opted-in hook, absent
  from snapshots, subscriptions, errors, and diagnostics

### Contract tests

- OpenAPI generation has no uncommitted diff
- Only embedded browser-safe operations are included
- Generated types compile against the public SDK surface

### Integration and browser tests

- Cart restore and abandoned/lost cart behavior
- Modifier selection, backend rejection, price adjustment, and cart refresh
- Buyer, address correction, rates, shipping selection, and discounts
- Expired shipping rates and server-authoritative totals
- Stripe test authorization, decline, cancellation, and 3DS/return recovery
- Timeout retry and prevention of duplicate payment attempts
- Zero-due order finalization and order recovery

## Local integration references

The SDK's VitePress documentation remains product-generic and never documents
one merchant's codebase or transition. A detailed first-consumer transition
plan, before/after call map, and local comparison material live only under
`.working/`. They guide SDK validation but are ignored by Git, unavailable to
the published documentation build, and cannot become a package dependency.

## Delivery sequence

1. Bootstrap the repository, package metadata, linting, test tooling, publish
   configuration, and changeset/version policy.
2. Add endpoint resolution (production default, alpha option, optional
   override), generated runtime config, and storage isolation.
3. Add selected-operation OpenAPI generation, filtered-source copy in local
   development, a committed generated contract, and contract drift checks.
4. Audit and, if needed, add the Sales embedded modifier contract before
   implementing catalog/modifier APIs. Add only its new operation IDs to the
   generator allowlist.
5. Implement stateless transport and persistent cart session semantics with
   tests.
6. Implement checkout, shipping, discounts, card handoff, and recovery.
7. Add privileged server handoff, lifecycle hooks, redaction guarantees, and
   security documentation.
8. Add TSDoc to the public surface, generate the VitePress SDK API reference,
   and enforce reference drift, links, and production-site build in CI.
9. Build a vanilla JavaScript reference integration and framework-neutral
   VitePress guides.
10. Validate the first consuming application using its local `.working/`
   transition plan, without changing any existing purchase-history rule.
11. Release an 0.x version, establish compatibility expectations, and promote to
   1.0 only after production-like first-consumer validation.

## V1 acceptance criteria

- A website can integrate a fully custom catalog/cart/checkout UI using only
  SDK JavaScript APIs.
- All Sales embedded API interactions are generated from the current OpenAPI
  contract, use only the selected operation allowlist, and pass contract drift
  checks.
- A VitePress site builds into deployable static documentation, and its
  generated SDK API reference is regenerated from the public TypeScript surface
  and checked for drift in CI.
- Production works with no API-base configuration; `environment: 'alpha'`
  selects the embedded alpha base; an explicit override remains optional.
- Runtime configuration can enable/disable payment and provide a Stripe
  connected account without a website rebuild. Stripe receives
  `stripeAccount` exactly when that account is supplied by the backend.
- Modifier selections are generated from a Sales-owned embedded contract and
  final availability/pricing always comes from returned cart state; no variant
  API is introduced.
- Capability keys and payment secrets cannot appear in standard snapshots,
  URLs, SDK logs, or errors, while an explicit trusted-server handoff provides
  a host the current cart ID/key it needs for server-side cart enrichment.
- Cart, shipping, discount, payment, free-order, and recovery flows are
  covered by automated tests.
- A first consumer can replace duplicated Sales browser client/state logic
  without moving its site-specific services into the SDK or disrupting its
  existing purchase-history gating behavior.
