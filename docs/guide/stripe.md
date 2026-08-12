# Stripe

The SDK does not bundle Stripe.js or handle card details. It reads the
browser-safe Sales runtime configuration and gives your Stripe integration the
values it needs.

```ts
import { loadStripe } from '@stripe/stripe-js';

const stripeConfig = await storefront.getStripeConfiguration();
if (!stripeConfig) throw new Error('Card payment is not available.');

const stripe = stripeConfig.stripeAccount
    ? await loadStripe(stripeConfig.publishableKey, {
        stripeAccount: stripeConfig.stripeAccount
    })
    : await loadStripe(stripeConfig.publishableKey);
```

When Sales provides a connected-account ID, pass it to Stripe.js as
`stripeAccount`. When it does not, do not send the option. Never infer an
account ID from the deployment environment.

After Stripe authorizes the PaymentIntent, record it with Sales:

```ts
const setup = await storefront.checkout.beginCardPayment();
if (setup) {
    // Confirm setup.clientSecret with your Stripe Elements UI.
    await storefront.checkout.completeCardPayment(setup);
}
```

For a zero-due cart, `beginCardPayment()` finalizes the order and returns `null`.
