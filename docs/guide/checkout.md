# Buyer, delivery, and discounts

Checkout operations live under `storefront.checkout` and always act on the
active cart. Collect information in the order that suits your interface, but
finish cart mutations before creating a payment attempt.

## Start from runtime capabilities

```ts
const config = await storefront.getConfig();

const checkoutFeatures = {
    addressVerification: config.capabilities.addressVerification,
    shipping: config.capabilities.shipping,
    discountCodes: config.capabilities.discountCodes,
    card: config.payments.cardEnabled
};
```

Capabilities come from Sales at runtime. Do not assume that every storefront
has shipping, discounts, address verification, or cards enabled.

## Subscribe to checkout state

```ts
const unsubscribe = storefront.checkout.subscribe(snapshot => {
    checkoutStore.set({
        order: snapshot.order,
        paymentAttemptId: snapshot.paymentAttemptId,
        paymentAttemptStatus: snapshot.paymentAttemptStatus,
        busy: snapshot.isBusy,
        error: snapshot.lastError
    });
});
```

Checkout and cart have separate snapshots:

| Snapshot | Render for |
| --- | --- |
| `storefront.cart` | Lines, totals, fulfillment, discounts, tax status |
| `storefront.checkout` | Payment progress, completed order, checkout busy/errors |

Checkout mutations that change the cart also update `storefront.cart`, so cart
subscribers stay in sync.

## Set the buyer

```ts
const cart = await storefront.checkout.setBuyer({
    name: 'Ada Lovelace',
    company: 'Analytical Engines Ltd.',
    email: 'ada@example.com',
    phone: '+1 555 010 1000',
    billingAddress: {
        street1: '123 Main Street', city: 'New York', state: 'NY', zip: '10001', country: 'US'
    }
});
```

`company` and `phone` are optional. This is the purchaser’s CRM identity:
send the buyer’s original typed name and company here, rather than a
carrier-normalized recipient. For membership carts, provide the purchaser’s billing address when
`cart.membershipRequirements.billingAddressRequired` is true, even when nothing
ships. Every membership belongs to the purchaser; the shipping recipient may differ. The returned cart is authoritative and is also
accepted into `storefront.cart`, so cart subscribers receive the update.

## Verify an address

Verification never silently replaces what the buyer entered:

```ts
const verification = await storefront.checkout.verifyAddress({
    address: {
        name: 'Ada Lovelace',
        company: 'Analytical Engines Ltd.',
        street1: '123 Main Street',
        street2: 'Suite 4',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1 555 010 1000'
    }
});

if (!verification.valid) {
    showAddressIssues(verification.issues);
} else {
    showVerifiedAddress(verification.address);
}
```

A valid response contains a normalized address and a verification `id`. Let the
buyer review the normalized result when it differs from their input. Only call
this path when `config.capabilities.addressVerification` is enabled.

## Request delivery rates

Use the verification ID when address verification is enabled:

```ts
if (!verification.valid) throw new Error('Resolve the address issues first.');

const rates = await storefront.checkout.getShippingRates({
    address: {
        verificationId: verification.address.id,
        country: verification.address.country
    }
});

if ('notApplicable' in rates) {
    showNoDeliveryRequired();
} else {
    renderDeliveryPackages(rates.packages);
}
```

For a storefront without address verification, provide the address fields
directly to `getShippingRates({ address: ... })`.

A shipping plan can contain multiple packages. The buyer must select one
`rateId` for each package that requires a rate.

## Quote a complete delivery selection

```ts
if ('notApplicable' in rates) throw new Error('No delivery selection is required.');

const packageRates = rates.packages.map(deliveryPackage => {
    const selectedRate = chooseRateForPackage(deliveryPackage);
    return {
        packageId: deliveryPackage.id,
        rateId: selectedRate.rateId
    };
});

const quote = await storefront.checkout.quoteShippingSelection({
    shippingPlanId: rates.id,
    packageRates
});

showShippingPrice(quote.shippingPrice);
```

The quote confirms the entire package/rate combination and returns the
authoritative shipping price. Do not total the individual rate prices yourself.

## Apply fulfillment

```ts
const verified = verification.address;

const cart = await storefront.checkout.setFulfillment({
    // Pass the CRM address selected by a returning customer, when there is one.
    crmAddressId: selectedSavedAddress?.id,
    recipient: {
        name: verified.name ?? 'Ada Lovelace',
        company: verified.company,
        email: 'ada@example.com',
        phone: verified.phone ?? '+1 555 010 1000',
        street1: verified.street1,
        street2: verified.street2,
        city: verified.city,
        state: verified.state,
        zip: verified.zip,
        country: verified.country,
        isVerified: true
    },
    shippingPlanId: quote.shippingPlanId,
    packageRates,
    notes: 'Leave with the front desk.'
});
```

The cart now contains the selected fulfillment and recalculated server totals.
To change delivery, calculate and quote a new selection before calling
`setFulfillment()` again.

When the checkout offers a saved CRM address, pass its `crmAddressId` unchanged
on every `setFulfillment()` call. Sales verifies that the address belongs to the
resolved buyer and reuses it instead of adding an address from carrier-formatted
fulfillment data.

Remove delivery from the cart with:

```ts
await storefront.checkout.removeFulfillment();
```

## Validate and apply a discount

Validation lets you show discount details without mutating the cart:

```ts
const discount = await storefront.checkout.validateDiscount('WELCOME10');

showDiscountPreview({
    name: discount.name,
    type: discount.type,
    amount: discount.amount,
    scope: discount.scope
});
```

Apply it in a separate authoritative mutation:

```ts
const cart = await storefront.checkout.applyDiscount({
    code: 'WELCOME10'
});

renderCart(cart);
```

Remove the active discount with:

```ts
await storefront.checkout.removeDiscount();
```

Always render `cart.appliedDiscount` and the recalculated totals returned by
Sales. A successful validation is not an applied discount. Only offer this UI
when `config.capabilities.discountCodes` is enabled.

## Accept recurring membership terms

After finishing buyer, item, discount, and delivery changes, render the server’s
terms from each membership line. Show the initial charge, renewal amount and
interval, and applicable validity. Obtain explicit consent to renewals and saving
the card before recording acceptance:

```ts
const cart = storefront.cart.getSnapshot().cart;
const requirements = cart?.membershipRequirements;
if (requirements?.recurringConsentRequired && buyerAcceptedRecurringTerms) {
    await storefront.checkout.acceptMembershipTerms(requirements.termsHash);
}
```

Any cart mutation clears acceptance. A changed catalog price or tier can also
reject payment setup; refresh the selection and obtain fresh consent. Ordinary
item and shipping discounts remain available in mixed carts. Membership coupons
and tab-wide discounts affecting membership charges are unavailable.

## Ready for payment

Before payment, verify that:

- the cart is loaded (`snapshot.hasCart` and `snapshot.cart`) and still open
- required buyer and billing address fields have been saved
- recurring terms have been explicitly accepted for the current cart
- every shippable package has a quoted and applied rate (when shipping applies)
- `cart.taxStatus` is acceptable for your UI (typically `ok`)
- no cart or checkout mutation is still busy
- your UI uses the current `cart.priceDue` returned by Sales

Then continue to [Stripe and order completion](./stripe). For merchant-side
validation immediately before payment setup, use the
[`beforePayment` hook](./hooks#beforepayment).

## Next steps

- [Stripe and order completion](./stripe)
- [Lifecycle hooks](./hooks)
- [Server handoff](./server-handoff)
