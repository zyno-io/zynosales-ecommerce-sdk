# Customer accounts

The SDK exposes customer authentication and payer-owned order history through
`storefront.customer`. Your static site owns the forms, messages, accessibility,
and navigation. Sales and Suite own credentials, verification, session expiry,
policy enforcement, and order ownership. A merchant server and cross-site
cookies are not required.

## Configure customer flows

Choose a complete set of flow options when creating the SDK instance. Every
option is explicit, and the storefront's published policy remains the server
enforced ceiling.

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

The SDK rejects a selection that exceeds the assigned policy or combines
incompatible flows. A session freezes the accepted options. To change them,
call `customer.logout()` and initialize a new session.

## Restore before checkout

Restore customer state before restoring an account-bound cart. `restore()`
checks the stored context and asks Sales for current server state before the SDK
exposes an authenticated session.

```ts
const customer = await storefront.customer.restore();
const savedCart = storefront.cart.getSnapshot();

if (savedCart.mode === 'account' && customer.state !== 'authenticated' && customer.state !== 'cart-resume') {
    await storefront.customer.resumeCart();
    // Render password or OTP login, then let the customer authenticate.
} else {
    await storefront.cart.restore();
}
```

`sessionStorage` is the default for customer sessions. It supports same-tab
reloads, navigation, and payment-provider returns while the server session is
valid. Pass `window.localStorage` as `customerStorage` when customers need
cross-tab or browser-restart continuity; the server still enforces the same
idle and absolute expiry. Local storage is readable by JavaScript on the site,
so it increases the impact of a storefront script compromise. If browser
storage is unavailable, the snapshot reports `persistence: 'memory'` and the
session will not survive a page reload.

```ts
const storefront = createZynoSales({
    publishableKey: 'zs_pk_...',
    customerStorage: window.localStorage,
    customer: { options: selectedCustomerFlows }
});
```

Cart capabilities, pending payment markers, and customer sessions use separate
storage keys. Account-mode cart and completed-order references never contain a
usable guest `orderKey`; old untagged references continue to be treated as guest
references.

## Login and registration

The SDK does not render customer UI. Keep passwords and codes in your form
state, pass them directly to the method, and do not log them or put them in SDK
snapshots.

```ts
await storefront.customer.initialize();
await storefront.customer.passwordLogin({ email, password });

const challenge = await storefront.customer.requestOtp(email);
await storefront.customer.verifyOtp({ challengeId: challenge.challengeId, code });

const registration = await storefront.customer.requestRegistration(email);
await storefront.customer.completeRegistration({
    challengeId: registration.challengeId,
    code,
    name,
    password // omit for an OTP-only account
});
```

Password and OTP login establish the same customer session. Registration uses a
separate mailbox proof and only sends the initial password after that proof is
verified. The SDK keeps codes and registration proofs out of persistent state.

For email links, use `exchangePasswordReset(token)` and then
`completePasswordReset(newPassword)` on a static landing page. Staff invitations
use `exchangeEnrollment(token)` and `completeInvitation({ password? })`;
login-email verification uses `exchangeLoginEmail(token)` and
`completeLoginEmail()`. These exchanges create restricted, short-lived sessions
in tab storage. Completion does not silently sign the customer in.

`requestPasswordProof()` and `verifyPasswordProof(...)` authorize a one-use
password replacement without the current password. `replacePassword(...)`
supports either the current password or that completed proof. Successful
password replacement clears the local session; the customer signs in again.
`requestPasswordReset(email)` sends the configured recovery flow and returns a
generic result.

## Account checkout and order history

After login, bind an existing guest cart only when the customer explicitly
chooses account checkout. Binding preserves the cart and payment attempt, and
Sales revalidates customer authority on every protected operation.

```ts
await storefront.customer.bindCart();
const orders = await storefront.customer.getOrders({ limit: 20 });
const order = await storefront.customer.getOrder(orders.items[0]!.id);
```

Order list and detail use the authenticated payer identity, not email matching,
recipient assignments, or an order key. The storefront's configured order
history scope is enforced by Sales. Cart-resume sessions can only access their
target cart/order and cannot read general account history.

For interrupted checkout, restore the customer session first, then the cart,
then call `storefront.checkout.recoverPayment()`. If the session expires, the
SDK retains cart and payment recovery references and reports the server error;
authenticate again before recovery. Authentication and binding do not reset
membership consent or a pending payment marker. Logout clears customer storage
and leaves an account-bound cart in account mode, so guest checkout must start
with a new cart.

The render-safe `customer` snapshot exposes state, effective options, expiry,
policy digest, authentication method/time, and next actions. It never includes
the session secret, a password, an OTP, or a proof token. Use HTTPS, a strict
content security policy, safe DOM rendering, and minimal third-party scripts.
