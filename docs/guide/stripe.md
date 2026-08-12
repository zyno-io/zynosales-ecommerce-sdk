# Stripe and order completion

The SDK creates and records Sales payment attempts but deliberately does not
bundle Stripe.js, render Elements, or handle card details. Your application owns
the payment UI; Stripe owns sensitive card input; Sales owns the cart and order.

## Install Stripe.js

```sh
yarn add @stripe/stripe-js
```

## Load Stripe from runtime configuration

```ts
import { loadStripe } from '@stripe/stripe-js';

const stripeConfig = await storefront.getStripeConfiguration();
if (!stripeConfig) throw new Error('Card payment is not available.');

const stripePromise = stripeConfig.stripeAccount
    ? loadStripe(stripeConfig.publishableKey, {
        stripeAccount: stripeConfig.stripeAccount
    })
    : loadStripe(stripeConfig.publishableKey);

const stripe = await stripePromise;
if (!stripe) throw new Error('Stripe.js could not be loaded.');
```

Pass the connected account exactly when Sales supplies one. Do not infer it
from a host name or environment.

## Begin a card payment

```ts
const setup = await storefront.checkout.beginCardPayment();
```

`beginCardPayment()` performs three things:

1. recovers an existing attempt when possible;
2. runs `beforePayment` before a new attempt and refreshes the cart afterward;
3. creates an idempotent Sales/Stripe payment setup for the current amount.

It returns a `CardPaymentSetup` with `clientSecret`, `paymentAttemptId`,
`paymentIntentId`, `amount`, and the current cart response.

If `setup` is `null`, the cart had nothing due and Sales finalized it without a
card. Read the completed order from the checkout snapshot:

```ts
if (!setup) {
    const order = storefront.checkout.getSnapshot().order;
    showReceipt(order);
}
```

## Mount your payment Element

```ts
if (!setup) throw new Error('This order does not require card payment.');

const elements = stripe.elements({
    clientSecret: setup.clientSecret
});

const paymentElement = elements.create('payment');
paymentElement.mount('#payment-element');
```

Never write the client secret to logs, analytics, URLs, application-wide render
state, or your own server response. Keep it within the payment view.

## Confirm with Stripe, then record with Sales

```ts
const stripeResult = await stripe.confirmPayment({
    elements,
    confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`
    },
    redirect: 'if_required'
});

if (stripeResult.error) {
    showPaymentError(stripeResult.error.message ?? 'Payment could not be authorized.');
    return;
}

const order = await storefront.checkout.completeCardPayment({
    paymentAttemptId: setup.paymentAttemptId,
    paymentIntentId: setup.paymentIntentId
});

showReceipt(order);
```

Call `completeCardPayment()` only after Stripe has authorized the PaymentIntent.
Sales verifies the attempt and returns the completed order. On completion, the
SDK clears the finished cart, retains bounded order-recovery state in session
storage, updates the checkout snapshot, and runs `afterOrderCompleted` once for
that stored order.

## Handle a redirected or interrupted payment

On application startup and Stripe return routes, restore the cart before asking
checkout to recover:

```ts
import { ZynoSalesError } from '@zyno-io/zynosales-ecommerce-sdk';

await storefront.cart.restore();

try {
    const order = await storefront.checkout.recoverPayment();
    if (order) showReceipt(order);
} catch (error) {
    const noRecoverableCheckout = error instanceof ZynoSalesError
        && error.message === 'There is no active cart.';

    if (!noRecoverableCheckout) throw error;
}
```

Recovery checks for an already-paid order, then checks a persisted payment
attempt. Authorized or recorded attempts are confirmed with Sales. Failed or
canceled attempt state is cleared. Repeated recovery is safe and does not rerun
the completion hook for the same stored order.

## Inspect or cancel an attempt

```ts
const attempt = await storefront.checkout.getPaymentAttempt(paymentAttemptId);

if (attempt.status === 'failed' || attempt.status === 'canceled') {
    showRetryButton();
}
```

Cancel an attempt the buyer no longer intends to use:

```ts
await storefront.checkout.cancelPaymentAttempt(paymentAttemptId);
```

Changing the cart, buyer, fulfillment, or discount invalidates local payment
recovery state. Start a new attempt after those changes.

## Read the completed order again

```ts
const order = await storefront.checkout.getOrder();
```

`getOrder()` uses the retained order capability and refreshes the completed
order from Sales. The capability itself is never exposed in snapshots.
