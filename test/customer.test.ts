import { describe, expect, it, vi } from 'vitest';

import { createZynoSales } from '../src/storefront';
import type { ZynoSalesStorage } from '../src/storage';
import type { ISalesEcommCustomerAuthOptions, ISalesEcommCustomerSession } from '../src/generated/sales';

class TestStorage implements ZynoSalesStorage {
    public readonly values = new Map<string, string>();
    public getItem(key: string) { return this.values.get(key) ?? null; }
    public setItem(key: string, value: string) { this.values.set(key, value); }
    public removeItem(key: string) { this.values.delete(key); }
}

const options: ISalesEcommCustomerAuthOptions = {
    passwordLogin: true,
    otpLogin: true,
    createAccount: true,
    createPassword: true,
    changePasswordWithCurrent: true,
    setPasswordWithoutCurrent: true,
    passwordRecovery: true
};

function session(phase: ISalesEcommCustomerSession['phase'] = 'anonymous'): ISalesEcommCustomerSession {
    return {
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        phase,
        expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
        idleExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        policy: {
            policyId: 'policy-1',
            policyRevision: 3,
            options,
            orderHistoryScope: 'ecomm',
            orderHistoryConfigRevision: 5,
            digest: 'policy-digest'
        },
        principal: phase === 'authenticated' ? { method: 'password', authenticatedAt: new Date().toISOString() } : null,
        targetCartId: null
    };
}

function configResponse(customerOptions: ISalesEcommCustomerAuthOptions = options) {
    return {
        tenantId: 'tenant-1',
        currency: 'usd',
        payments: { cardEnabled: false, stripeEnvironment: 'live', stripePublishableKey: null, stripeConnectedAccountId: null },
        capabilities: { addressVerification: true, shipping: true, discountCodes: true, pinnedBuyer: true },
        customerAuth: {
            enabled: true,
            policyId: 'policy-1',
            policyRevision: 3,
            options: customerOptions,
            passwordRequirements: { minimumLength: 10, maximumLength: 128, minimumCharacterClasses: 3 },
            orderHistoryScope: 'ecomm',
            orderHistoryConfigRevision: 5
        }
    };
}

function persistedSessionRecord(sessionSecret: string, sessionId: string) {
    const { principal: _principal, ...metadata } = { ...session('authenticated'), sessionId };
    return {
        version: 1,
        apiBase: 'https://sales.example',
        namespace: 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1',
        keyIdentity: 'zynosales:ecommerce:https%3A%2F%2Fsales.example:key%3Azs_pk_test',
        origin: null,
        restricted: false,
        sessionSecret,
        session: metadata
    };
}

describe('CustomerAuth', () => {
    it('initializes an immutable policy, logs in, and persists only minimal session metadata', async () => {
        const customerStorage = new TestStorage();
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const requestLog: Array<{ path: string; method: string; body?: unknown; customerSession: string | null }> = [];
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            const body = ['POST', 'PUT'].includes(request.method) ? await request.json().catch(() => undefined) : undefined;
            requestLog.push({ path, method: request.method, body, customerSession: request.headers.get('x-zs-customer-session') });

            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') {
                return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            }
            if (path.endsWith('/auth/password')) {
                return Response.json({ session: session('authenticated'), sessionSecret: 'authenticated-secret', rotated: true });
            }
            if (path.endsWith('/sessions/current')) return Response.json({ session: session('authenticated'), principal: session('authenticated').principal });
            return Response.json({});
        });
        const storefront = createZynoSales({
            apiBase: 'https://sales.example',
            publishableKey: 'zs_pk_test',
            storage: cartStorage,
            sessionStorage: paymentStorage,
            customerStorage,
            customer: { options },
            fetch
        });

        await storefront.customer.initialize();
        const loggedIn = await storefront.customer.passwordLogin({ email: 'shopper@example.test', password: 'never-store-this' });

        expect(loggedIn.state).toBe('authenticated');
        expect(loggedIn.options).toEqual(options);
        expect(loggedIn.authenticationMethod).toBe('password');
        expect(JSON.stringify(loggedIn)).not.toContain('authenticated-secret');
        expect(JSON.stringify(loggedIn)).not.toContain('contact-private-id');
        expect(requestLog.map(({ path, method }) => [path, method])).toEqual([
            ['/embedded/sales/ecomm/config', 'GET'],
            ['/embedded/sales/ecomm/sessions', 'POST'],
            ['/embedded/sales/ecomm/auth/password', 'POST']
        ]);
        expect(requestLog[1]?.body).toEqual({ policyId: 'policy-1', policyRevision: 3, options });
        expect(requestLog[2]?.customerSession).toBe('anonymous-secret');

        const persisted = [...customerStorage.values.values()].join('\n');
        expect(persisted).toContain('authenticated-secret');
        expect(persisted).not.toContain('never-store-this');
        expect(persisted).not.toContain('contact-private-id');
    });

    it('ignores same-session refresh writes, invalidates account switches, and honors cross-tab logout', async () => {
        const localStorage = new TestStorage();
        const browserSessionStorage = new TestStorage();
        const storageListeners = new Set<(event: StorageEvent) => void>();
        vi.stubGlobal('window', {
            localStorage,
            sessionStorage: browserSessionStorage,
            addEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.add(listener),
            removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.delete(listener)
        });
        const requests: Array<{ path: string; method: string; customerSession: string | null }> = [];
        const sessionB = { ...session('authenticated'), sessionId: 'session-B' };
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            requests.push({ path, method: request.method, customerSession: request.headers.get('x-zs-customer-session') });
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') {
                return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            }
            if (path.endsWith('/auth/password')) {
                return Response.json({ session: session('authenticated'), sessionSecret: 'tab-session-secret', rotated: true });
            }
            if (path.endsWith('/sessions/current') && request.method === 'GET') {
                const current = request.headers.get('x-zs-customer-session') === 'new-account-secret' ? sessionB : session('authenticated');
                return Response.json({ session: current, principal: current.principal });
            }
            return Response.json({});
        });
        const storefrontOptions = {
            apiBase: 'https://sales.example',
            publishableKey: 'zs_pk_test',
            customer: { options },
            fetch
        } as const;

        try {
            const firstTab = createZynoSales(storefrontOptions);
            await firstTab.customer.initialize();
            const loggedIn = await firstTab.customer.passwordLogin({ email: 'shopper@example.test', password: 'test-password' });
            expect(loggedIn.persistence).toBe('local');

            const secondTab = createZynoSales(storefrontOptions);
            const restored = await secondTab.customer.restore();
            expect(restored.state).toBe('authenticated');
            expect(restored.persistence).toBe('local');
            expect(requests.find(request => request.path.endsWith('/sessions/current'))?.customerSession).toBe('tab-session-secret');

            secondTab.cart.accept({
                cartId: 'account-cart',
                cartKey: 'account-cart-secret',
                cart: { customer: { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' } }
            } as never);
            const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
            const dispatchStorage = (oldValue: string | null, newValue: string | null) => {
                const event = { key: storageKey, oldValue, newValue, storageArea: localStorage } as unknown as StorageEvent;
                for (const listener of storageListeners) listener(event);
            };

            const sameSessionRecord = JSON.parse(localStorage.getItem(storageKey)!);
            const originalExpiry = restored.expiresAt;
            sameSessionRecord.session.expiresAt = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
            const sameSessionValue = JSON.stringify(sameSessionRecord);
            localStorage.setItem(storageKey, sameSessionValue);
            dispatchStorage(JSON.stringify(sameSessionRecord), sameSessionValue);

            expect(secondTab.customer.getSnapshot().state).toBe('authenticated');
            expect(secondTab.customer.getSnapshot().expiresAt).toBe(originalExpiry);
            expect(secondTab.cart.getSnapshot()).toMatchObject({ hasCart: true, mode: 'account' });

            const accountBRecord = {
                ...sameSessionRecord,
                sessionSecret: 'new-account-secret',
                session: { ...sameSessionRecord.session, sessionId: 'session-B' }
            };
            const accountBValue = JSON.stringify(accountBRecord);
            const cartKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:cart';
            const accountBCart = JSON.stringify({
                version: 2, mode: 'account', cartId: 'account-cart-B', cartKey: 'account-cart-B-secret',
                scope: { policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' }
            });
            localStorage.setItem(storageKey, accountBValue);
            localStorage.setItem(cartKey, accountBCart);
            dispatchStorage(sameSessionValue, accountBValue);

            expect(secondTab.customer.getSnapshot().state).toBe('expired');
            expect(secondTab.cart.getSnapshot()).toMatchObject({ hasCart: false, mode: null });
            expect(localStorage.getItem(storageKey)).toBe(accountBValue);
            expect(localStorage.getItem(cartKey)).toBe(accountBCart);

            const restoredB = await secondTab.customer.restore();
            expect(restoredB.state).toBe('authenticated');
            secondTab.cart.accept({
                cartId: 'account-cart-B',
                cartKey: 'account-cart-B-secret',
                cart: { customer: { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' } }
            } as never);
            const accountBStoredValue = localStorage.getItem(storageKey);
            dispatchStorage(accountBStoredValue, null);
            expect(secondTab.customer.getSnapshot().state).toBe('authenticated');
            expect(secondTab.cart.getSnapshot()).toMatchObject({ hasCart: true, mode: 'account' });
            localStorage.removeItem(storageKey);
            dispatchStorage(accountBStoredValue, null);

            expect(secondTab.customer.getSnapshot().state).toBe('expired');
            expect(secondTab.cart.getSnapshot()).toMatchObject({ hasCart: false, mode: null });
            expect(localStorage.getItem(cartKey)).toBeNull();
            const requestCount = requests.length;
            await expect(secondTab.customer.getOrders()).rejects.toThrow('Initialize or restore a customer session first.');
            expect(requests).toHaveLength(requestCount);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('does not resurrect a session when restore completes after cross-tab logout', async () => {
        const localStorage = new TestStorage();
        const browserSessionStorage = new TestStorage();
        const storageListeners = new Set<(event: StorageEvent) => void>();
        vi.stubGlobal('window', {
            localStorage,
            sessionStorage: browserSessionStorage,
            addEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.add(listener),
            removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.delete(listener)
        });
        const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
        const oldRecord = JSON.stringify(persistedSessionRecord('old-secret', 'old-session'));
        localStorage.setItem(storageKey, oldRecord);
        let onCurrentRequest: (() => void) | undefined;
        let resolveCurrent!: (response: Response) => void;
        const currentRequestStarted = new Promise<void>(resolve => { onCurrentRequest = resolve; });
        const currentResponse = new Promise<Response>(resolve => { resolveCurrent = resolve; });
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const path = new URL(new Request(input).url).pathname;
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions/current')) {
                onCurrentRequest?.();
                return currentResponse;
            }
            return Response.json({});
        });

        try {
            const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', customer: { options }, fetch });
            const restoring = storefront.customer.restore();
            await currentRequestStarted;

            localStorage.removeItem(storageKey);
            const logoutEvent = { key: storageKey, oldValue: oldRecord, newValue: null, storageArea: localStorage } as unknown as StorageEvent;
            for (const listener of storageListeners) listener(logoutEvent);
            resolveCurrent(Response.json({ session: session('authenticated'), principal: session('authenticated').principal }));

            await expect(restoring).rejects.toMatchObject({ code: 'REAUTHENTICATION_REQUIRED', status: 401 });
            expect(storefront.customer.getSnapshot().state).toBe('expired');
            expect(localStorage.getItem(storageKey)).toBeNull();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('does not let a stale restore rejection delete a newer account session', async () => {
        const localStorage = new TestStorage();
        const browserSessionStorage = new TestStorage();
        const storageListeners = new Set<(event: StorageEvent) => void>();
        vi.stubGlobal('window', {
            localStorage,
            sessionStorage: browserSessionStorage,
            addEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.add(listener),
            removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.delete(listener)
        });
        const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
        const oldRecord = JSON.stringify(persistedSessionRecord('old-secret', 'old-session'));
        localStorage.setItem(storageKey, oldRecord);
        let onCurrentRequest: (() => void) | undefined;
        let resolveCurrent!: (response: Response) => void;
        const currentRequestStarted = new Promise<void>(resolve => { onCurrentRequest = resolve; });
        const currentResponse = new Promise<Response>(resolve => { resolveCurrent = resolve; });
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const path = new URL(new Request(input).url).pathname;
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions/current')) {
                onCurrentRequest?.();
                return currentResponse;
            }
            return Response.json({});
        });

        try {
            const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', customer: { options }, fetch });
            const restoring = storefront.customer.restore();
            await currentRequestStarted;

            const newerRecord = JSON.stringify(persistedSessionRecord('rotated-secret', 'old-session'));
            localStorage.setItem(storageKey, newerRecord);
            const accountSwitchEvent = { key: storageKey, oldValue: oldRecord, newValue: newerRecord, storageArea: localStorage } as unknown as StorageEvent;
            for (const listener of storageListeners) listener(accountSwitchEvent);
            resolveCurrent(Response.json({ code: 'REAUTHENTICATION_REQUIRED', message: 'Sign in again.' }, { status: 401 }));

            await expect(restoring).rejects.toMatchObject({ code: 'REAUTHENTICATION_REQUIRED', status: 401 });
            expect(storefront.customer.getSnapshot().state).toBe('expired');
            expect(localStorage.getItem(storageKey)).toBe(newerRecord);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('keeps a same-session server renewal when an older tab reaches its local deadline', async () => {
        const localStorage = new TestStorage();
        const browserSessionStorage = new TestStorage();
        const storageListeners = new Set<(event: StorageEvent) => void>();
        vi.stubGlobal('window', {
            localStorage,
            sessionStorage: browserSessionStorage,
            addEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.add(listener),
            removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.delete(listener)
        });
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') {
                return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            }
            if (path.endsWith('/auth/password')) {
                return Response.json({ session: session('authenticated'), sessionSecret: 'tab-session-secret', rotated: true });
            }
            if (path.endsWith('/sessions/current')) {
                return Response.json({ session: session('authenticated'), principal: session('authenticated').principal });
            }
            return Response.json({ items: [], nextCursor: null });
        });
        const storefrontOptions = {
            apiBase: 'https://sales.example',
            publishableKey: 'zs_pk_test',
            customer: { options },
            fetch
        } as const;

        try {
            const firstTab = createZynoSales(storefrontOptions);
            await firstTab.customer.initialize();
            const oldSnapshot = await firstTab.customer.passwordLogin({ email: 'shopper@example.test', password: 'test-password' });
            const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
            const oldSavedRecord = localStorage.getItem(storageKey)!;

            vi.setSystemTime(Date.now() + 10_000);
            const secondTab = createZynoSales(storefrontOptions);
            await secondTab.customer.restore();
            const renewedRecord = localStorage.getItem(storageKey)!;
            expect(renewedRecord).not.toBe(oldSavedRecord);
            const renewalEvent = { key: storageKey, oldValue: oldSavedRecord, newValue: renewedRecord, storageArea: localStorage } as unknown as StorageEvent;
            for (const listener of storageListeners) listener(renewalEvent);

            vi.setSystemTime(Date.parse(oldSnapshot.idleExpiresAt!) + 1_000);
            await expect(firstTab.customer.getOrders()).rejects.toMatchObject({ code: 'REAUTHENTICATION_REQUIRED', status: 401 });

            expect(localStorage.getItem(storageKey)).toBe(renewedRecord);
            const restored = await firstTab.customer.restore();
            expect(restored.state).toBe('authenticated');
            expect(localStorage.getItem(storageKey)).not.toBeNull();
        } finally {
            vi.useRealTimers();
            vi.unstubAllGlobals();
        }
    });

    it('keeps tab-restricted proof sessions when another tab signs in or out normally', async () => {
        const localStorage = new TestStorage();
        const proofTabStorage = new TestStorage();
        const normalTabStorage = new TestStorage();
        const storageListeners = new Set<(event: StorageEvent) => void>();
        const browser = {
            localStorage,
            sessionStorage: proofTabStorage,
            addEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.add(listener),
            removeEventListener: (_type: string, listener: (event: StorageEvent) => void) => storageListeners.delete(listener)
        };
        vi.stubGlobal('window', browser);
        const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
        const proofRecord = persistedSessionRecord('proof-secret', 'proof-session');
        proofRecord.restricted = true;
        proofRecord.session.phase = 'enrollment';
        const proofValue = JSON.stringify(proofRecord);
        proofTabStorage.setItem(storageKey, proofValue);
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            const secret = request.headers.get('x-zs-customer-session');
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions/current') && request.method === 'GET') {
                const current = secret === 'proof-secret'
                    ? { ...session('enrollment'), sessionId: 'proof-session' }
                    : { ...session('authenticated'), sessionId: 'session-B' };
                return Response.json({ session: current, principal: current.principal });
            }
            if (path.endsWith('/sessions') && request.method === 'POST') {
                return Response.json({ session: session(), sessionSecret: 'anonymous-B', rotated: false });
            }
            if (path.endsWith('/auth/password')) {
                return Response.json({ session: { ...session('authenticated'), sessionId: 'session-B' }, sessionSecret: 'account-B-secret', rotated: true });
            }
            if (path.endsWith('/sessions/current') && request.method === 'DELETE') return new Response(null, { status: 204 });
            return Response.json({});
        });
        const common = { apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', customer: { options }, fetch } as const;

        try {
            const proofTab = createZynoSales(common);
            const proofRestored = await proofTab.customer.restore();
            expect(proofRestored.state).toBe('restricted');
            expect(proofRestored.persistence).toBe('session');
            const proofStoredAfterRestore = proofTabStorage.getItem(storageKey)!;

            browser.sessionStorage = normalTabStorage;
            const normalTab = createZynoSales(common);
            await normalTab.customer.initialize();
            await normalTab.customer.passwordLogin({ email: 'account-b@example.test', password: 'test-password' });
            const normalRecord = localStorage.getItem(storageKey)!;
            const signedInEvent = { key: storageKey, oldValue: null, newValue: normalRecord, storageArea: localStorage } as unknown as StorageEvent;
            for (const listener of storageListeners) listener(signedInEvent);

            expect(proofTab.customer.getSnapshot().state).toBe('restricted');
            expect(proofTab.customer.getSnapshot().persistence).toBe('session');
            expect(proofTabStorage.getItem(storageKey)).toBe(proofStoredAfterRestore);

            const proofRestoredAgain = await proofTab.customer.restore();
            expect(proofRestoredAgain.state).toBe('restricted');
            expect(localStorage.getItem(storageKey)).toBe(normalRecord);
            expect(proofTabStorage.getItem(storageKey)).not.toBeNull();

            await normalTab.customer.logout();
            const logoutEvent = { key: storageKey, oldValue: normalRecord, newValue: null, storageArea: localStorage } as unknown as StorageEvent;
            for (const listener of storageListeners) listener(logoutEvent);

            expect(proofTab.customer.getSnapshot().state).toBe('restricted');
            expect(proofTabStorage.getItem(storageKey)).not.toBeNull();
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('restores through Sales and preserves migrated guest cart capabilities', async () => {
        const customerStorage = new TestStorage();
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions/current')) {
                expect(request.headers.get('x-zs-customer-session')).toBe('restorable-secret');
                return Response.json({ session: session(), principal: null });
            }
            if (path.endsWith('/carts/cart-1')) {
                expect(request.headers.get('x-zs-customer-session')).toBe('restorable-secret');
                return Response.json({ cartId: 'cart-1', cartKey: 'cart-key', cart: { customer: { bound: false } } });
            }
            return Response.json({});
        });
        cartStorage.setItem('zynosales:ecommerce:https%3A%2F%2Fsales.example:key%3Azs_pk_test:cart', JSON.stringify({ cartId: 'cart-1', cartKey: 'cart-key', orderKey: 'old-order-key' }));
        const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', storage: cartStorage, sessionStorage: paymentStorage, customerStorage, fetch });
        const storageKey = 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:customer';
        customerStorage.setItem(storageKey, JSON.stringify({
            version: 1,
            apiBase: 'https://sales.example',
            namespace: 'zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1',
            keyIdentity: 'zynosales:ecommerce:https%3A%2F%2Fsales.example:key%3Azs_pk_test',
            origin: null,
            restricted: false,
            sessionSecret: 'restorable-secret',
            session: {
                tenantId: 'tenant-1',
                sessionId: 'session-1',
                phase: 'anonymous',
                expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
                idleExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
                policy: session().policy,
                targetCartId: null
            }
        }));
        const restored = await storefront.customer.restore();

        expect(restored.state).toBe('anonymous');
        expect([...cartStorage.values.keys()]).toEqual(['zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:cart']);
        expect(cartStorage.getItem('zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:cart')).toContain('old-order-key');
        expect(cartStorage.getItem('zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:cart')).toContain('"mode":"guest"');
    });

    it('rejects a requested flow outside the storefront policy before initializing', async () => {
        const restricted: ISalesEcommCustomerAuthOptions = { ...options, otpLogin: false };
        const fetch: typeof globalThis.fetch = vi.fn(async () => Response.json(configResponse(restricted)));
        const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', customer: { options }, fetch });

        await expect(storefront.customer.initialize()).rejects.toMatchObject({ code: 'AUTH_OPTION_DISABLED', status: 403 });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('clears a revoked customer session but preserves the cart capability for recovery', async () => {
        const customerStorage = new TestStorage();
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const base = 'zynosales:ecommerce:https%3A%2F%2Fsales.example';
        cartStorage.setItem(`${base}:key%3Azs_pk_test:cart`, JSON.stringify({ cartId: 'cart-1', cartKey: 'cart-key', orderKey: 'guest-order-key' }));
        customerStorage.setItem(`${base}:tenant-1:customer`, JSON.stringify({
            version: 1,
            apiBase: 'https://sales.example',
            namespace: `${base}:tenant-1`,
            keyIdentity: `${base}:key%3Azs_pk_test`,
            origin: null,
            restricted: false,
            sessionSecret: 'revoked-secret',
            session: {
                tenantId: 'tenant-1', sessionId: 'session-1', phase: 'anonymous',
                expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
                idleExpiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
                policy: session().policy, targetCartId: null
            }
        }));
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            if (new URL(request.url).pathname.endsWith('/config')) return Response.json(configResponse());
            return Response.json({ code: 'REAUTHENTICATION_REQUIRED', message: 'Sign in again.' }, { status: 401 });
        });
        const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', storage: cartStorage, sessionStorage: paymentStorage, customerStorage, fetch });

        await expect(storefront.customer.restore()).rejects.toMatchObject({ code: 'REAUTHENTICATION_REQUIRED', status: 401 });

        expect(storefront.customer.getSnapshot().state).toBe('expired');
        expect(customerStorage.getItem(`${base}:tenant-1:customer`)).toBeNull();
        expect(cartStorage.getItem(`${base}:tenant-1:cart`)).toContain('guest-order-key');
    });

    it('keeps registration codes and one-use proofs out of session storage', async () => {
        const customerStorage = new TestStorage();
        const calls: Array<{ path: string; body: unknown }> = [];
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            const body = request.method === 'POST' ? await request.json().catch(() => undefined) : undefined;
            calls.push({ path, body });
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            if (path.endsWith('/auth/registration') && request.method === 'POST') return Response.json({ challengeId: 'challenge-1', expiresInSeconds: 600, resendAfterSeconds: 60 });
            if (path.endsWith('/auth/registration/verify')) return Response.json({ proof: 'one-use-proof', expiresInSeconds: 300 });
            if (path.endsWith('/auth/registration/complete')) return Response.json({ session: session('authenticated'), sessionSecret: 'enrolled-session', rotated: true });
            return Response.json({});
        });
        const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', customerStorage, customer: { options }, fetch });

        await storefront.customer.initialize();
        await storefront.customer.requestRegistration('new@example.test');
        const completed = await storefront.customer.completeRegistration({ challengeId: 'challenge-1', code: '12345678', name: 'New Shopper', password: 'never-store-password' });

        expect(completed.state).toBe('authenticated');
        expect(calls.map(call => call.path.replace('/embedded/sales/ecomm/', ''))).toEqual([
            'config', 'sessions', 'auth/registration', 'auth/registration/verify', 'auth/registration/complete'
        ]);
        expect(calls.find(call => call.path.endsWith('/auth/registration/complete'))?.body).toEqual({ proof: 'one-use-proof', name: 'New Shopper', password: 'never-store-password' });
        const saved = [...customerStorage.values.values()].join('\n');
        expect(saved).not.toContain('12345678');
        expect(saved).not.toContain('one-use-proof');
        expect(saved).not.toContain('never-store-password');
    });

    it('binds a cart into account mode without persisting an order key or clearing payment recovery', async () => {
        const customerStorage = new TestStorage();
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const base = 'zynosales:ecommerce:https%3A%2F%2Fsales.example';
        cartStorage.setItem(`${base}:key%3Azs_pk_test:cart`, JSON.stringify({ cartId: 'cart-1', cartKey: 'cart-key', orderKey: 'guest-order-key' }));
        paymentStorage.setItem(`${base}:key%3Azs_pk_test:payment`, JSON.stringify({ cartId: 'cart-1', idempotencyKey: 'pending-payment', paymentAttemptId: 'attempt-1' }));
        const calls: Array<{ path: string; method: string; session: string | null }> = [];
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            calls.push({ path, method: request.method, session: request.headers.get('x-zs-customer-session') });
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            if (path.endsWith('/auth/password')) return Response.json({ session: session('authenticated'), sessionSecret: 'authenticated-secret', rotated: true });
            if (path.endsWith('/carts/cart-1/customer')) return Response.json({
                cartId: 'cart-1', cartKey: 'cart-key', orderKey: 'stale-guest-key',
                cart: { customer: { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' } }
            });
            if (path.endsWith('/customer/orders/cart-1')) return Response.json({
                id: 'cart-1', source: 'ecomm', saleNumber: 'S-1', status: 'paid',
                createdAt: new Date().toISOString(), closedAt: new Date().toISOString(), items: [],
                totals: { discounted: 1000, base: 1000, tax: 0, total: 1000, paid: 1000, due: 0 },
                paymentStatus: 'captured', fulfillmentStatus: null
            });
            if (path.endsWith('/sessions/current') && request.method === 'DELETE') return new Response(null, { status: 204 });
            return Response.json({});
        });
        const storefront = createZynoSales({ apiBase: 'https://sales.example', publishableKey: 'zs_pk_test', storage: cartStorage, sessionStorage: paymentStorage, customerStorage, customer: { options }, fetch });

        await storefront.customer.initialize();
        await storefront.customer.passwordLogin({ email: 'shopper@example.test', password: 'test-password' });
        await storefront.customer.bindCart();

        const reference = storefront.cart.requireReference();
        expect(reference.mode).toBe('account');
        expect(reference && 'orderKey' in reference).toBe(false);
        const storedCart = cartStorage.getItem(`${base}:tenant-1:cart`);
        expect(storedCart).not.toContain('stale-guest-key');
        expect(storedCart).not.toContain('guest-order-key');
        expect(storedCart).toContain('"mode":"account"');
        expect(paymentStorage.getItem(`${base}:tenant-1:payment`)).toContain('pending-payment');
        expect(calls.find(call => call.path.endsWith('/carts/cart-1/customer'))?.session).toBe('authenticated-secret');

        await storefront.customer.logout();

        expect(storefront.cart.getSnapshot()).toMatchObject({ hasCart: false, mode: null });
        expect(cartStorage.getItem(`${base}:tenant-1:cart`)).toBeNull();
        expect(paymentStorage.getItem(`${base}:tenant-1:payment`)).toBeNull();
        expect(paymentStorage.getItem(`${base}:tenant-1:payment:orphan-account`)).toContain('pending-payment');
        const recoveryReference = paymentStorage.getItem(`${base}:tenant-1:payment:completed`)!;
        expect(recoveryReference).toContain('"mode":"account"');
        expect(recoveryReference).toContain('"orderId":"cart-1"');
        expect(recoveryReference).not.toContain('orderKey');
        expect(calls.find(call => call.path.endsWith('/sessions/current') && call.method === 'DELETE')?.session).toBe('authenticated-secret');

        await storefront.customer.initialize();
        await storefront.customer.passwordLogin({ email: 'shopper@example.test', password: 'test-password' });
        const recovered = await storefront.checkout.recoverPayment();

        expect(recovered?.id).toBe('cart-1');
        expect(calls.some(call => call.path.endsWith('/customer/orders/cart-1'))).toBe(true);
        expect(calls.some(call => call.path.endsWith('/carts/cart-1'))).toBe(false);
        expect(calls.some(call => call.path.endsWith('/setup-payment'))).toBe(false);
        expect(paymentStorage.getItem(`${base}:tenant-1:payment`)).toBeNull();
        expect(paymentStorage.getItem(`${base}:tenant-1:payment:orphan-account`)).toBeNull();
    });

    it('clears local account state and attempts server revocation when browser storage throws', async () => {
        const customerStorage = new TestStorage();
        const cartStorage = new TestStorage();
        const paymentStorage = new TestStorage();
        const requests: Array<{ path: string; method: string; customerSession: string | null }> = [];
        const fetch: typeof globalThis.fetch = vi.fn(async input => {
            const request = new Request(input);
            const path = new URL(request.url).pathname;
            requests.push({ path, method: request.method, customerSession: request.headers.get('x-zs-customer-session') });
            if (path.endsWith('/config')) return Response.json(configResponse());
            if (path.endsWith('/sessions') && request.method === 'POST') {
                return Response.json({ session: session(), sessionSecret: 'anonymous-secret', rotated: false });
            }
            if (path.endsWith('/auth/password')) {
                return Response.json({ session: session('authenticated'), sessionSecret: 'authenticated-secret', rotated: true });
            }
            if (path.endsWith('/sessions/current') && request.method === 'DELETE') return new Response(null, { status: 204 });
            return Response.json({});
        });
        const storefront = createZynoSales({
            apiBase: 'https://sales.example',
            publishableKey: 'zs_pk_test',
            storage: cartStorage,
            sessionStorage: paymentStorage,
            customerStorage,
            customer: { options },
            fetch
        });

        await storefront.customer.initialize();
        await storefront.customer.passwordLogin({ email: 'shopper@example.test', password: 'test-password' });
        storefront.cart.accept({
            cartId: 'account-cart', cartKey: 'cart-secret',
            cart: { customer: { bound: true, policyId: 'policy-1', policyRevision: 3, orderHistoryScope: 'ecomm' } }
        } as never);
        paymentStorage.setItem('zynosales:ecommerce:https%3A%2F%2Fsales.example:tenant-1:payment', JSON.stringify({
            cartId: 'account-cart', idempotencyKey: 'idem-1', paymentAttemptId: 'attempt-1'
        }));

        customerStorage.removeItem = () => { throw new Error('storage unavailable'); };
        cartStorage.removeItem = () => { throw new Error('storage unavailable'); };
        paymentStorage.setItem = () => { throw new Error('storage unavailable'); };
        await storefront.customer.logout();

        expect(storefront.customer.getSnapshot().state).toBe('expired');
        expect(storefront.cart.getSnapshot()).toMatchObject({ hasCart: false, mode: null });
        expect(requests.some(request => request.path.endsWith('/sessions/current') && request.method === 'DELETE'
            && request.customerSession === 'authenticated-secret')).toBe(true);
        const requestCount = requests.length;
        await expect(storefront.customer.getOrders()).rejects.toThrow('Initialize or restore a customer session first.');
        expect(requests).toHaveLength(requestCount);
    });
});
