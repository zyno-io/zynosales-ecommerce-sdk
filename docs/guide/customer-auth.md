# Customer accounts

Let customers sign in, see their orders, and check out with their account using
`storefront.customer`. You build the forms and choose which sign-in options to
show. The SDK handles the requests and saved sign-in state. This works on a
static HTML site with your publishable key; you don't need your own server.

## Choose your sign-in options

Enable the options you want to offer when you create the storefront. These must
also be enabled in your storefront's Zyno settings.

```ts
import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    customer: {
        options: {
            passwordLogin: true,
            otpLogin: true,
            createAccount: true,
            createPassword: true,
            changePasswordWithCurrent: true,
            setPasswordWithoutCurrent: true,
            passwordRecovery: true
        }
    }
});
```

Choose all seven options explicitly. The selection stays fixed while a customer
is signing in or using their account. If you need a different selection, sign
out with `customer.logout()` and start a new session with `customer.initialize()`.

## Welcome returning customers

Customer sign-in uses `localStorage` by default, so closing a tab doesn't erase
it. On each page, call `restore()` before showing account details. It checks the
saved session with Zyno and returns the customer's current sign-in state.

```ts
const customer = await storefront.customer.restore();

if (customer.state === 'uninitialized' || customer.state === 'expired') {
    const savedCart = storefront.cart.getSnapshot();
    if (savedCart.mode === 'account') {
        await storefront.customer.resumeCart();
    } else {
        await storefront.customer.initialize();
    }
    // Show your sign-in form when the customer is ready.
}
```

A customer can return in another tab or reopen the browser while their session
is still valid. Sessions currently expire after 30 minutes without activity or
12 hours after sign-in, whichever comes first. Saving a session doesn't extend
those limits. Zyno also checks whether the session has been signed out or
revoked. You don't need an extra cookie to track validity.

For a storefront that should remember sign-in only in the current tab, pass
`customerStorage: window.sessionStorage` when creating the SDK. A custom
`ZynoSalesStorage` adapter is also supported. If browser storage is unavailable,
the SDK keeps sign-in in memory; `getSnapshot().persistence` reports `'memory'`,
and reloading the page requires signing in again.

Password-reset and invitation links use a separate, short-lived session stored
only in the current tab. They do not become a saved customer login. If
`restore()` returns `state: 'restricted'`, keep that account step open rather
than starting sign-in or resuming a cart.

## Sign in with a password

Once a session has been initialized, submit your sign-in form with:

```ts
await storefront.customer.passwordLogin({ email, password });
```

The SDK updates the customer snapshot when sign-in succeeds. Use
`customer.subscribe(...)` to update your account menu or checkout buttons.

## Sign in with an email code

Request a code when the customer submits their email, then verify the code they
enter:

```ts
const challenge = await storefront.customer.requestOtp(email);
// Keep challenge.challengeId for the code-entry form.

await storefront.customer.verifyOtp({
    challengeId: challenge.challengeId,
    code
});
```

Email-code sign-in gives the customer the same account access as password
sign-in. Codes expire after ten minutes and can be used once. Wait at least
60 seconds before requesting another; only the latest code works. Use a message
such as “If this email can sign in, we'll send you a code.”

## Create an account

Start by verifying the customer's email:

```ts
const registration = await storefront.customer.requestRegistration(email);
```

When they enter the code, submit it with their name and optional password:

```ts
await storefront.customer.completeRegistration({
    challengeId: registration.challengeId,
    code,
    name,
    password // Leave this out for an account that uses email codes only.
});
```

The customer is signed in after registration succeeds. If Zyno can safely match
an existing contact, the account can include that contact's earlier orders.
Addresses shared by multiple contacts need help from the merchant before an
account can be created.

## Help customers reset a password

Send a recovery email from your “Forgot password?” form:

```ts
await storefront.customer.requestPasswordReset(email);
```

Show the same confirmation whether or not an account exists: “If we can reset
this account, we'll email you a link.” Requesting a link doesn't change the
password or sign the customer out.

On your recovery page, read the token from the URL fragment and remove the
fragment before loading analytics or other third-party scripts. When the
customer chooses to continue, exchange the token:

```ts
await storefront.customer.exchangePasswordReset(token);
```

Then submit their new password:

```ts
await storefront.customer.completePasswordReset(newPassword);
```

After the password changes, show the normal sign-in form again. Reset links
expire after 30 minutes and can be used once; after opening the recovery step,
the customer has five minutes to finish.

Staff invitations and login-email confirmation links follow a similar pattern:

| Email link | Start after the customer chooses to continue | Finish |
| --- | --- | --- |
| Account invitation | `exchangeEnrollment(token)` | `completeInvitation({ password })`; the password is optional |
| Confirm a new login email | `exchangeLoginEmail(token)` | `completeLoginEmail()` |

These methods are on `storefront.customer`. Completing either flow returns the
customer to sign-in; it doesn't sign them in automatically.

## Change a password while signed in

If the customer knows their current password:

```ts
await storefront.customer.replacePassword({ currentPassword, newPassword });
```

You can also offer an email code so they don't need the current password:

```ts
const challenge = await storefront.customer.requestPasswordProof();
await storefront.customer.verifyPasswordProof({
    challengeId: challenge.challengeId,
    code
});
await storefront.customer.replacePassword({ newPassword });
```

This second option must be enabled for the session. A recent email-code sign-in
also allows it for five minutes. After any password change, ask the customer to
sign in again.

## Check out with an account

After sign-in, attach the current cart when the customer chooses to use their
account:

```ts
await storefront.customer.bindCart();
```

Then use the usual [checkout](./checkout) and [payment](./stripe) methods. The
cart keeps its contents, and signing in again to the same account doesn't
restart a payment already in progress. Once attached, that cart belongs to the
account; switching accounts requires a new cart.

If checkout was interrupted, restore customer sign-in first, then restore the
cart and check the payment result:

```ts
await storefront.customer.restore();
await storefront.cart.restore();
const order = await storefront.checkout.recoverPayment();
```

If sign-in has expired, use `resumeCart()` and show your sign-in form before
continuing. This lets the original customer finish that checkout. To open their
full order history, start a regular sign-in session instead.

## Show order history

```ts
const orders = await storefront.customer.getOrders({ limit: 20 });
const firstOrder = orders.items[0];

if (firstOrder) {
    const order = await storefront.customer.getOrder(firstOrder.id);
    // Render the order details and status in your UI.
}
```

Zyno returns orders belonging to the signed-in customer's account. Your
storefront settings decide whether the list includes online orders only or
orders from all sales channels. Use `orders.nextCursor` in the next `getOrders()`
call to load another page.

## Sign out

```ts
await storefront.customer.logout();
```

Sign-out clears saved sign-in and asks Zyno to revoke the session. Other open
tabs stop using that saved sign-in too. A cart attached to the account is removed
from the active checkout, so the next customer starts with a new cart. The SDK
keeps a small payment-status reference for an interrupted account payment; it
can be checked explicitly after the original customer signs in again.

## Connect your UI

`customer.getSnapshot()` and `customer.subscribe(...)` give you the current
state, available actions, expiry, and any error to display. Passwords, email
codes, and session tokens are never included in those snapshots.

Pass passwords and codes straight from your forms to the SDK, then clear the
fields. Keep them out of logs, analytics, and URLs. Serve your storefront over
HTTPS and keep third-party scripts to the ones you need: scripts on the page
can access browser storage. Use a content security policy and render customer
input as text rather than HTML.
