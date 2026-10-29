import { createZynoSales } from '@zyno-io/zynosales-ecommerce-sdk';

const storefront = createZynoSales({
    publishableKey: '<your-publishable-key>',
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

const status = document.querySelector<HTMLElement>('#customer-status')!;
const orderSummary = document.querySelector<HTMLElement>('#order-summary')!;
let otpChallengeId: string | null = null;
let registrationChallengeId: string | null = null;

function render(snapshot: ReturnType<typeof storefront.customer.getSnapshot>): void {
    if (snapshot.isBusy) {
        status.textContent = 'One moment…';
    } else if (snapshot.lastError) {
        status.textContent = snapshot.lastError.message;
    } else if (snapshot.state === 'authenticated') {
        status.textContent = 'You’re signed in. You can view your orders or check out with your account.';
    } else if (snapshot.state === 'restricted') {
        status.textContent = 'Finish the account step from your email before continuing.';
    } else if (snapshot.state === 'cart-resume') {
        status.textContent = snapshot.authenticationMethod
            ? 'You’re signed in to finish your saved checkout.'
            : 'Sign in to finish your saved checkout.';
    } else {
        status.textContent = 'Sign in with your password or an email code.';
    }
}

function values(event: SubmitEvent): FormData {
    event.preventDefault();
    return new FormData(event.currentTarget as HTMLFormElement);
}

function field(data: FormData, name: string): string {
    return String(data.get(name) ?? '');
}

function onError(error: unknown): void {
    status.textContent = error instanceof Error ? error.message : 'The account request failed.';
}

storefront.customer.subscribe(render);

try {
    const restored = await storefront.customer.restore();
    const cartState = storefront.cart.getSnapshot();
    if (cartState.mode === 'account' && (restored.state === 'uninitialized' || restored.state === 'expired' || restored.state === 'anonymous')) {
        await storefront.customer.resumeCart();
    } else if (restored.state === 'uninitialized' || restored.state === 'expired') {
        await storefront.customer.initialize();
    }
} catch (error) {
    onError(error);
}

document.querySelector<HTMLFormElement>('#password-login')!.addEventListener('submit', event => {
    const data = values(event);
    void storefront.customer.passwordLogin({ email: field(data, 'email'), password: field(data, 'password') })
        .then(render).catch(onError);
    (event.currentTarget as HTMLFormElement).reset();
});

document.querySelector<HTMLFormElement>('#otp-request')!.addEventListener('submit', event => {
    const data = values(event);
    void storefront.customer.requestOtp(field(data, 'email')).then(challenge => {
        otpChallengeId = challenge.challengeId;
        status.textContent = 'If the address can sign in, a code will arrive by email.';
    }).catch(onError);
});

document.querySelector<HTMLFormElement>('#otp-verify')!.addEventListener('submit', event => {
    const data = values(event);
    if (!otpChallengeId) {
        status.textContent = 'Request a code first.';
        return;
    }
    void storefront.customer.verifyOtp({ challengeId: otpChallengeId, code: field(data, 'code') })
        .then(render).catch(onError);
    (event.currentTarget as HTMLFormElement).reset();
});

document.querySelector<HTMLFormElement>('#registration-request')!.addEventListener('submit', event => {
    const data = values(event);
    void storefront.customer.requestRegistration(field(data, 'email')).then(challenge => {
        registrationChallengeId = challenge.challengeId;
        status.textContent = 'If registration is available, a verification code will arrive by email.';
    }).catch(onError);
});

document.querySelector<HTMLFormElement>('#registration-complete')!.addEventListener('submit', event => {
    const data = values(event);
    if (!registrationChallengeId) {
        status.textContent = 'Request a registration code first.';
        return;
    }
    const password = field(data, 'password');
    void storefront.customer.completeRegistration({
        challengeId: registrationChallengeId,
        code: field(data, 'code'),
        name: field(data, 'name'),
        ...(password ? { password } : {})
    }).then(render).catch(onError);
    (event.currentTarget as HTMLFormElement).reset();
});

document.querySelector<HTMLFormElement>('#password-reset')!.addEventListener('submit', event => {
    const data = values(event);
    void storefront.customer.requestPasswordReset(field(data, 'email')).then(() => {
        status.textContent = 'If the account can be recovered, an email will arrive with next steps.';
    }).catch(onError);
});

document.querySelector<HTMLButtonElement>('#bind-cart')!.addEventListener('click', () => {
    void storefront.customer.bindCart().then(() => {
        status.textContent = 'You’re checking out with your account.';
    }).catch(onError);
});

document.querySelector<HTMLButtonElement>('#load-orders')!.addEventListener('click', () => {
    void storefront.customer.getOrders({ limit: 20 }).then(result => {
        orderSummary.textContent = `${result.items.length} orders found.`;
    }).catch(onError);
});

document.querySelector<HTMLButtonElement>('#sign-out')!.addEventListener('click', () => {
    void storefront.customer.logout()
        .then(() => storefront.customer.initialize())
        .then(render).catch(onError);
});
