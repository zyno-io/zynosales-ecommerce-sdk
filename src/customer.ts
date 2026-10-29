import type { CartSession } from './cart';
import type { ZynoSalesClient } from './client';
import { ZynoSalesError, toPublicError, type PublicError } from './errors';
import type { CheckoutCoordinator } from './checkout';
import { storageNamespace } from './configuration';
import { defaultSessionStorage, type BrowserStorageMode, type ZynoSalesStorage } from './storage';
import type { CustomerSnapshot, StorefrontConfig } from './types';
import type {
    ISalesEcommCustomerAuthOptions,
    ISalesEcommCustomerOrderListResponse,
    ISalesEcommCustomerOrderResponse,
    ISalesEcommCustomerSession,
    ISalesEcommCustomerSessionGrantResponse
} from './generated/sales';

type PersistedCustomerSession = {
    version: 1;
    apiBase: string;
    namespace: string;
    keyIdentity: string;
    origin: string | null;
    restricted: boolean;
    sessionSecret: string;
    session: Omit<ISalesEcommCustomerSession, 'principal'>;
};

export type CustomerInitializationOptions = ISalesEcommCustomerAuthOptions;

/** Sign customers in, remember their sessions, and connect account checkout and order history. */
export class CustomerAuth {
    private readonly client: ZynoSalesClient;
    private readonly cart: CartSession;
    private readonly checkout: CheckoutCoordinator;
    private readonly apiBase: string;
    private readonly keyIdentity: string;
    private readonly configuredOptions?: CustomerInitializationOptions;
    private readonly config: () => Promise<StorefrontConfig>;
    private readonly restrictedStorage: ZynoSalesStorage;
    private readonly storageMode: BrowserStorageMode;
    private storage: ZynoSalesStorage;
    private storageKey: string;
    private namespace: string;
    private record: PersistedCustomerSession | null = null;
    private session: ISalesEcommCustomerSession | null = null;
    private sessionGeneration = 0;
    private state: CustomerSnapshot['state'] = 'uninitialized';
    private busy = false;
    private lastError: PublicError | null = null;
    private readonly listeners = new Set<(snapshot: CustomerSnapshot) => void>();
    private storageListener?: (event: StorageEvent) => void;

    public constructor(options: {
        client: ZynoSalesClient;
        cart: CartSession;
        checkout: CheckoutCoordinator;
        storage: ZynoSalesStorage;
        restrictedStorage?: ZynoSalesStorage;
        storageMode: BrowserStorageMode;
        storageKey: string;
        namespace: string;
        apiBase: string;
        publishableKey: string;
        configuredOptions?: CustomerInitializationOptions;
        config: () => Promise<StorefrontConfig>;
    }) {
        this.client = options.client;
        this.cart = options.cart;
        this.checkout = options.checkout;
        this.storage = options.storage;
        this.restrictedStorage = options.restrictedStorage ?? defaultSessionStorage();
        this.storageMode = options.storageMode;
        this.storageKey = options.storageKey;
        this.namespace = options.namespace;
        this.apiBase = options.apiBase;
        this.keyIdentity = storageNamespace(options.apiBase, `key:${options.publishableKey}`);
        this.configuredOptions = options.configuredOptions;
        this.config = options.config;
        this.client.setCustomerSessionInvalidListener(error => {
            this.sessionGeneration++;
            const record = this.record;
            if (record) this.clearPersistedRecords(record);
            else this.clearActiveRecord();
            this.state = 'expired';
            this.lastError = toPublicError(error);
            try {
                this.checkout.detachAccountCartForLogout({ preserveOtherStoredCart: true });
            } catch {
                // In-memory session invalidation must not depend on shared storage cleanup.
            }
            this.emit();
        });
        this.listenForStorageChanges();
    }

    /** Returns customer state for your UI, without passwords, session tokens, or personal details. */
    public getSnapshot(): CustomerSnapshot {
        const session = this.session;
        const principal = session?.principal ?? null;
        return {
            state: this.state,
            isBusy: this.busy,
            expiresAt: session?.expiresAt ?? null,
            idleExpiresAt: session?.idleExpiresAt ?? null,
            policyId: session?.policy.policyId ?? null,
            policyRevision: session?.policy.policyRevision ?? null,
            policyDigest: session?.policy.digest ?? null,
            orderHistoryScope: session?.policy.orderHistoryScope ?? null,
            options: session?.policy.options ?? null,
            authenticationMethod: principal?.method ?? null,
            authenticatedAt: principal?.authenticatedAt ?? null,
            persistence: this.record?.restricted ? 'session' : this.storageMode,
            availableActions: this.availableActions(session),
            lastError: this.lastError
        };
    }

    /** Keeps your account menu and forms up to date as customer state changes. */
    public subscribe(listener: (snapshot: CustomerSnapshot) => void): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());
        return () => this.listeners.delete(listener);
    }

    /** Starts a customer session using the flows this storefront enables. The browser saves it locally by default. */
    public initialize(options: CustomerInitializationOptions | undefined = this.configuredOptions): Promise<CustomerSnapshot> {
        return this.run(async () => {
            if (!options) throw new ZynoSalesError('Choose customer flows when creating the storefront or calling initialize.');
            const config = await this.config();
            const existing = this.readPersistedRecord();
            if (existing && !isLocallyExpired(existing.session)) {
                throw new ZynoSalesError('Restore or log out of the existing customer session before initializing another one.');
            }
            if (existing) this.clearPersistedRecords(existing);
            else this.clearActiveRecord();
            const customerAuth = config.customerAuth;
            if (!customerAuth.enabled || !customerAuth.policyId || customerAuth.policyRevision === null || !customerAuth.options) {
                throw new ZynoSalesError('Customer accounts are unavailable for this storefront.');
            }
            validateSelectedOptions(options, customerAuth.options);
            const grant = await this.client.initializeCustomerSession({
                policyId: customerAuth.policyId,
                policyRevision: customerAuth.policyRevision,
                options
            });
            this.acceptGrant(grant, false);
            return this.getSnapshot();
        });
    }

    /** Checks a saved session with Sales before returning its state; local data alone never restores sign-in. */
    public restore(): Promise<CustomerSnapshot> {
        return this.run(async () => {
            await this.config();
            const record = this.readPersistedRecord();
            if (!record) {
                this.clearActiveRecord();
                this.state = 'uninitialized';
                return this.getSnapshot();
            }
            if (isLocallyExpired(record.session)) {
                this.clearPersistedRecords(record);
                this.state = 'expired';
                this.emit();
                return this.getSnapshot();
            }
            if (!this.matchesCurrentContext(record) || (this.configuredOptions && !sameOptions(record.session.policy.options, this.configuredOptions))) {
                this.clearPersistedRecords(record);
                this.state = 'expired';
                throw policyMismatch();
            }

            this.client.setCustomerSessionSecret(null);
            const generation = this.sessionGeneration;
            let current: Awaited<ReturnType<ZynoSalesClient['getCustomerSession']>>;
            try {
                current = await this.client.getCustomerSession(record.sessionSecret);
            } catch (error) {
                const normalized = error instanceof ZynoSalesError ? error : null;
                if (normalized?.status === 401 || normalized?.status === 409) {
                    this.clearPersistedRecords(record);
                    this.state = 'expired';
                }
                throw error;
            }
            if (generation !== this.sessionGeneration || !this.isCurrentSavedSession(record)) {
                this.sessionGeneration++;
                this.clearActiveRecord();
                this.state = 'expired';
                try {
                    this.checkout.detachAccountCartForLogout({ preserveOtherStoredCart: true });
                } catch {
                    // The stale response cannot restore authority, even if cleanup storage is unavailable.
                }
                throw invalidatedInAnotherTab();
            }
            if (current.session.sessionId !== record.session.sessionId
                || !samePolicy(current.session, record.session)
                || current.session.targetCartId !== record.session.targetCartId) {
                this.clearPersistedRecords(record);
                this.state = 'expired';
                throw policyMismatch();
            }
            this.record = { ...record, session: persistedSession(current.session) };
            this.session = current.session;
            this.writeRecord(this.record);
            this.client.setCustomerSessionSecret(record.sessionSecret);
            this.state = stateForSession(current.session);
            this.lastError = null;
            return this.getSnapshot();
        });
    }

    /** Starts password login. The request is never automatically retried. */
    public passwordLogin(input: { email: string; password: string }): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('anonymous');
            requireOption(record.session.policy.options, 'passwordLogin');
            const grant = await this.client.passwordLogin(record.sessionSecret, input);
            this.acceptGrant(grant, record.restricted);
            return this.getSnapshot();
        });
    }

    /** Requests an email one-time code for login. */
    public requestOtp(email: string) {
        return this.run(async () => {
            const record = this.requirePhase('anonymous');
            requireOption(record.session.policy.options, 'otpLogin');
            return this.client.requestCustomerOtp(record.sessionSecret, { email });
        });
    }

    /** Verifies a login code and rotates the anonymous session secret. */
    public verifyOtp(input: { challengeId: string; code: string }): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('anonymous');
            requireOption(record.session.policy.options, 'otpLogin');
            const result = await this.client.verifyCustomerOtp(record.sessionSecret, input);
            if (result.purpose !== 'login') throw new ZynoSalesError('The Sales response did not establish a login session.');
            this.acceptGrant(result.session, record.restricted);
            return this.getSnapshot();
        });
    }

    /** Requests a registration verification code without submitting a password or profile data. */
    public requestRegistration(email: string) {
        return this.run(async () => {
            const record = this.requirePhase('anonymous');
            this.requireNotCartResume(record);
            requireOption(record.session.policy.options, 'createAccount');
            return this.client.requestCustomerRegistration(record.sessionSecret, { email });
        });
    }

    /** Verifies a registration code and completes the proof-bound enrollment in one SDK call. */
    public completeRegistration(input: { challengeId: string; code: string; name: string; password?: string }): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('anonymous');
            this.requireNotCartResume(record);
            requireOption(record.session.policy.options, 'createAccount');
            const proof = await this.client.verifyCustomerRegistration(record.sessionSecret, {
                challengeId: input.challengeId, code: input.code
            });
            if (input.password !== undefined) requireOption(record.session.policy.options, 'createPassword');
            const grant = await this.client.completeCustomerRegistration(record.sessionSecret, {
                proof: proof.proof, name: input.name, ...(input.password !== undefined ? { password: input.password } : {})
            });
            this.acceptGrant(grant, record.restricted);
            return this.getSnapshot();
        });
    }

    /** Requests an email recovery link using the current anonymous or authenticated session. */
    public requestPasswordReset(email: string) {
        return this.run(async () => {
            const record = this.requireRecord();
            this.requireNotCartResume(record);
            requireOption(record.session.policy.options, 'passwordRecovery');
            return this.client.requestCustomerPasswordReset(record.sessionSecret, { email });
        });
    }

    /** Exchanges an emailed recovery token into a restricted, tab-scoped proof session. */
    public exchangePasswordReset(token: string): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const previous = this.record ?? this.readPersistedRecord();
            if (previous) this.clearPersistedRecords(previous);
            else this.clearActiveRecord();
            const grant = await this.client.exchangeCustomerPasswordReset({ token });
            this.acceptGrant(grant, true);
            return this.getSnapshot();
        });
    }

    /** Completes an email-link password reset and clears the consumed restricted session. */
    public completePasswordReset(newPassword: string): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('recovery');
            requireOption(record.session.policy.options, 'passwordRecovery');
            await this.client.completeCustomerPasswordReset(record.sessionSecret, { newPassword });
            this.clearPersistedRecords(record);
            this.state = 'expired';
            return this.getSnapshot();
        });
    }

    /** Requests a mailbox proof for a password change that omits the current password. */
    public requestPasswordProof() {
        return this.run(async () => {
            const record = this.requireAuthenticatedRecord();
            this.requireNotCartResume(record);
            requireOption(record.session.policy.options, 'setPasswordWithoutCurrent');
            return this.client.requestCustomerPasswordProof(record.sessionSecret);
        });
    }

    /** Verifies the mailbox code for the current password-change session. */
    public verifyPasswordProof(input: { challengeId: string; code: string }): Promise<void> {
        return this.run(async () => {
            const record = this.requireAuthenticatedRecord();
            this.requireNotCartResume(record);
            requireOption(record.session.policy.options, 'setPasswordWithoutCurrent');
            await this.client.verifyCustomerPasswordProof(record.sessionSecret, input);
        });
    }

    /** Changes a password with the current password or a previously verified mailbox proof. */
    public replacePassword(input: { newPassword: string; currentPassword?: string }): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requireAuthenticatedRecord();
            this.requireNotCartResume(record);
            const option = input.currentPassword === undefined ? 'setPasswordWithoutCurrent' : 'changePasswordWithCurrent';
            requireOption(record.session.policy.options, option);
            await this.client.replaceCustomerPassword(record.sessionSecret, input);
            this.clearPersistedRecords(record);
            this.state = 'expired';
            return this.getSnapshot();
        });
    }

    /** Exchanges an invitation token into a restricted tab-scoped enrollment session. */
    public exchangeEnrollment(token: string): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const previous = this.record ?? this.readPersistedRecord();
            if (previous) this.clearPersistedRecords(previous);
            else this.clearActiveRecord();
            const grant = await this.client.exchangeCustomerEnrollment({ token });
            this.acceptGrant(grant, true);
            return this.getSnapshot();
        });
    }

    /** Completes an approved invitation. It does not sign the customer in. */
    public completeInvitation(input: { password?: string } = {}): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('enrollment');
            if (input.password !== undefined) requireOption(record.session.policy.options, 'createPassword');
            await this.client.completeCustomerInvitation(record.sessionSecret, input);
            this.clearPersistedRecords(record);
            this.state = 'expired';
            return this.getSnapshot();
        });
    }

    /** Exchanges a login-email verification token into a restricted tab-scoped session. */
    public exchangeLoginEmail(token: string): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const previous = this.record ?? this.readPersistedRecord();
            if (previous) this.clearPersistedRecords(previous);
            else this.clearActiveRecord();
            const grant = await this.client.exchangeCustomerLoginEmail({ token });
            this.acceptGrant(grant, true);
            return this.getSnapshot();
        });
    }

    /** Completes the verified login-email replacement and requires ordinary login afterward. */
    public completeLoginEmail(): Promise<CustomerSnapshot> {
        return this.run(async () => {
            const record = this.requirePhase('loginEmailVerification');
            await this.client.completeCustomerLoginEmail(record.sessionSecret);
            this.clearPersistedRecords(record);
            this.state = 'expired';
            return this.getSnapshot();
        });
    }

    /** Signs out in this tab, clears its account cart, and asks Sales to revoke the session. */
    public logout(): Promise<CustomerSnapshot> {
        return this.run(async () => {
            let record = this.record;
            if (!record) {
                try {
                    record = this.readPersistedRecord();
                } catch {
                    record = null;
                }
            }
            try {
                this.checkout.detachAccountCartForLogout({ preserveOtherStoredCart: true });
            } catch {
                // Local logout and server revocation must proceed if cart storage is unavailable.
            }
            this.sessionGeneration++;
            this.clearActiveRecord();
            this.state = 'expired';
            if (record) {
                this.removeStoredRecordIfSame(this.storage, record);
                this.removeStoredRecordIfSame(this.restrictedStorage, record);
            }
            try {
                this.emit();
            } catch {
                // Listener failures must not prevent server-side revocation.
            }
            if (record) await this.client.logoutCustomerSession(record.sessionSecret);
            return this.getSnapshot();
        });
    }

    /** Binds the authenticated contact to the active cart without clearing payment recovery state. */
    public bindCart(): Promise<void> {
        return this.checkout.runExclusive(async () => {
            this.busy = true;
            this.emit();
            try {
                const record = this.requireAuthenticatedRecord();
                await this.cart.runExclusive(async () => {
                    const reference = this.cart.requireReference();
                    const response = await this.client.bindCustomerCart(reference.cartId, reference.cartKey, record.sessionSecret);
                    this.cart.accept(response);
                });
                this.lastError = null;
            } catch (error) {
                if (error instanceof ZynoSalesError && error.isNetworkError) {
                    try {
                        const refreshed = await this.cart.refresh();
                        if (refreshed.cart?.customer.bound) {
                            this.lastError = null;
                            return;
                        }
                    } catch {
                        // Preserve the original bind failure and all checkout references.
                    }
                }
                this.lastError = toPublicError(error);
                throw error;
            } finally {
                this.busy = false;
                this.emit();
            }
        });
    }

    /** Explicitly creates a restricted session to authenticate for the active account cart. */
    public resumeCart(): Promise<CustomerSnapshot> {
        return this.checkout.runExclusive(() => this.cart.runExclusive(async () => {
            this.busy = true;
            this.emit();
            try {
                const reference = this.cart.requireReference();
                if (reference.mode !== 'account') throw new ZynoSalesError('The active cart is not account-bound.');
                this.clearActiveRecord();
                const grant = await this.client.resumeCustomerCartSession(reference.cartId, reference.cartKey);
                this.acceptGrant(grant, true);
                return this.getSnapshot();
            } catch (error) {
                this.lastError = toPublicError(error);
                throw error;
            } finally {
                this.busy = false;
                this.emit();
            }
        }));
    }

    /** Lists payer-owned customer orders using the active verified customer session. */
    public getOrders(query?: { cursor?: string; limit?: number }): Promise<ISalesEcommCustomerOrderListResponse> {
        return this.run(async () => {
            const record = this.requireAuthenticatedRecord();
            if (record.session.targetCartId) throw new ZynoSalesError('Cart recovery sessions cannot read general order history.');
            return this.client.getCustomerOrders(record.sessionSecret, query);
        });
    }

    /** Reads one payer-owned customer order without an order capability key. */
    public getOrder(orderId: string): Promise<ISalesEcommCustomerOrderResponse> {
        return this.run(async () => {
            const record = this.requireAuthenticatedRecord();
            return this.client.getCustomerOrder(orderId, record.sessionSecret);
        });
    }

    /** @internal Moves customer state into the tenant/key-scoped storage namespace. */
    public setStorageKey(storageKey: string, namespace: string): void {
        if (this.storageKey === storageKey && this.namespace === namespace) return;
        const oldKey = this.storageKey;
        const oldRecord = this.readPersistedRecord();
        this.storageKey = storageKey;
        this.namespace = namespace;
        const scoped = this.readPersistedRecord();
        if (!scoped && oldRecord && oldRecord.apiBase === this.apiBase && oldRecord.keyIdentity === this.keyIdentity && oldRecord.origin === currentOrigin()) {
            const migrated = { ...oldRecord, namespace: this.namespace };
            this.writeRecord(migrated);
            this.record = migrated;
        }
        this.storage.removeItem(oldKey);
        this.restrictedStorage.removeItem(oldKey);
        this.emit();
    }

    private availableActions(session: ISalesEcommCustomerSession | null): string[] {
        if (!session) return [];
        const options = session.policy.options;
        if (session.targetCartId) {
            if (session.phase === 'authenticated') return ['bindCart', 'getOrder', 'logout'];
            if (session.phase === 'anonymous') return [
                ...(options.passwordLogin ? ['passwordLogin'] : []),
                ...(options.otpLogin ? ['requestOtp', 'verifyOtp'] : []),
                'logout'
            ];
            return ['logout'];
        }
        if (session.phase === 'anonymous') {
            return [
                ...(options.passwordLogin ? ['passwordLogin'] : []),
                ...(options.otpLogin ? ['requestOtp', 'verifyOtp'] : []),
                ...(options.createAccount ? ['requestRegistration', 'completeRegistration'] : []),
                ...(options.passwordRecovery ? ['requestPasswordReset'] : [])
            ];
        }
        if (session.phase === 'authenticated') {
            return [
                'bindCart', 'getOrders', 'getOrder',
                ...(options.changePasswordWithCurrent ? ['changePasswordWithCurrent'] : []),
                ...(options.setPasswordWithoutCurrent ? ['requestPasswordProof', 'verifyPasswordProof', 'setPasswordWithoutCurrent'] : []),
                ...(options.passwordRecovery ? ['requestPasswordReset'] : []),
                'logout'
            ];
        }
        if (session.phase === 'recovery') return ['completePasswordReset', 'logout'];
        if (session.phase === 'enrollment') return ['completeInvitation', 'logout'];
        if (session.phase === 'loginEmailVerification') return ['completeLoginEmail', 'logout'];
        return [];
    }

    private async run<T>(operation: () => Promise<T>): Promise<T> {
        return this.checkout.runExclusive(() => this.cart.runExclusive(async () => {
            this.busy = true;
            this.emit();
            try {
                this.lastError = null;
                return await operation();
            } catch (error) {
                if (isTerminalSessionError(error)) {
                    const record = this.record;
                    if (record) this.clearPersistedRecords(record);
                    else this.clearActiveRecord();
                    this.state = 'expired';
                }
                this.lastError = toPublicError(error);
                this.emit();
                throw error;
            } finally {
                this.busy = false;
                this.emit();
            }
        }));
    }

    private requireRecord(): PersistedCustomerSession {
        const record = this.record;
        if (!record || !this.session || !this.matchesCurrentContext(record)) throw new ZynoSalesError('Initialize or restore a customer session first.');
        if (isLocallyExpired(record.session)) {
            this.clearPersistedRecords(record);
            this.state = 'expired';
            throw new ZynoSalesError('Your customer session has expired.', { status: 401, code: 'REAUTHENTICATION_REQUIRED' });
        }
        return record;
    }

    private requireAuthenticatedRecord(): PersistedCustomerSession {
        const record = this.requireRecord();
        if (this.session?.phase !== 'authenticated' || !this.session.principal) {
            throw new ZynoSalesError('Sign in to continue.', { status: 401, code: 'REAUTHENTICATION_REQUIRED' });
        }
        return record;
    }

    private requirePhase(phase: ISalesEcommCustomerSession['phase']): PersistedCustomerSession {
        const record = this.requireRecord();
        if (record.session.phase !== phase) throw new ZynoSalesError(`This customer action requires a ${phase} session.`);
        return record;
    }

    private requireNotCartResume(record: PersistedCustomerSession): void {
        if (record.session.targetCartId) throw new ZynoSalesError('Account changes are unavailable while recovering a cart.');
    }

    private acceptGrant(grant: ISalesEcommCustomerSessionGrantResponse, restricted: boolean): void {
        const record: PersistedCustomerSession = {
            version: 1,
            apiBase: this.apiBase,
            namespace: this.namespace,
            keyIdentity: this.keyIdentity,
            origin: currentOrigin(),
            restricted,
            sessionSecret: grant.sessionSecret,
            session: persistedSession(grant.session)
        };
        this.record = record;
        this.session = grant.session;
        this.persistRecord(record);
        this.client.setCustomerSessionSecret(grant.sessionSecret);
        this.state = stateForSession(grant.session);
        this.lastError = null;
        this.emit();
    }

    private persistRecord(record: PersistedCustomerSession): void {
        const storage = record.restricted ? this.restrictedStorage : this.storage;
        if (!record.restricted) this.restrictedStorage.removeItem(this.storageKey);
        storage.setItem(this.storageKey, JSON.stringify(record));
    }

    private writeRecord(record: PersistedCustomerSession): void {
        this.persistRecord(record);
    }

    private readPersistedRecord(): PersistedCustomerSession | null {
        const restricted = this.readFromStorage(this.restrictedStorage);
        if (restricted && this.matchesCurrentContext(restricted) && !isLocallyExpired(restricted.session)) return restricted;
        const normal = this.readFromStorage(this.storage);
        return normal ?? restricted;
    }

    private readFromStorage(storage: ZynoSalesStorage): PersistedCustomerSession | null {
        const raw = storage.getItem(this.storageKey);
        return raw ? parsePersistedRecord(raw) : null;
    }

    private matchesCurrentContext(record: PersistedCustomerSession): boolean {
        return record.apiBase === this.apiBase && record.namespace === this.namespace
            && record.keyIdentity === this.keyIdentity && record.origin === currentOrigin();
    }

    private clearPersistedRecords(expected: PersistedCustomerSession): void {
        this.removeStoredRecordIfSame(this.storage, expected);
        this.removeStoredRecordIfSame(this.restrictedStorage, expected);
        this.clearActiveRecord();
    }

    private removeStoredRecordIfSame(storage: ZynoSalesStorage, expected: PersistedCustomerSession): void {
        try {
            const stored = this.readFromStorage(storage);
            if (stored && sameSavedSessionSnapshot(stored, expected)) storage.removeItem(this.storageKey);
        } catch {
            // A failed read cannot authorize deleting another tab's saved session.
        }
    }

    private isCurrentSavedSession(expected: PersistedCustomerSession): boolean {
        try {
            const current = this.readPersistedRecord();
            return !!current && sameSavedSessionIdentity(current, expected);
        } catch {
            return false;
        }
    }

    private clearActiveRecord(): void {
        this.record = null;
        this.session = null;
        this.client.setCustomerSessionSecret(null);
    }

    private listenForStorageChanges(): void {
        if (typeof window === 'undefined') return;
        this.storageListener = event => {
            if (event.storageArea !== (this.storage as Storage) || (event.key !== null && event.key !== this.storageKey)) return;
            if (this.record?.restricted) return;
            let stored: PersistedCustomerSession | null = null;
            try {
                stored = this.readPersistedRecord();
            } catch {
                // Failure to read shared state cannot preserve this tab's authority.
            }
            if (this.record && stored && sameSavedSessionIdentity(stored, this.record)) return;
            this.sessionGeneration++;
            const record = this.record;
            if (record) this.clearPersistedRecords(record);
            else this.clearActiveRecord();
            this.state = 'expired';
            try {
                this.checkout.detachAccountCartForLogout({ preserveOtherStoredCart: true });
            } catch {
                // A storage event still revokes in-memory authority if cleanup storage is unavailable.
            }
            this.emit();
        };
        window.addEventListener('storage', this.storageListener);
    }

    private emit(): void {
        const snapshot = this.getSnapshot();
        for (const listener of this.listeners) listener(snapshot);
    }
}

function validateSelectedOptions(selected: CustomerInitializationOptions, allowed: CustomerInitializationOptions): void {
    const keys = Object.keys(allowed) as Array<keyof CustomerInitializationOptions>;
    if (keys.length !== 7 || keys.some(key => typeof selected[key] !== 'boolean')) {
        throw new ZynoSalesError('Every customer flow option must be explicitly selected.');
    }
    if (keys.some(key => selected[key] && !allowed[key])) {
        throw new ZynoSalesError('The selected customer flows exceed this storefront policy.', { status: 403, code: 'AUTH_OPTION_DISABLED' });
    }
    if (selected.passwordRecovery && !selected.setPasswordWithoutCurrent) {
        throw new ZynoSalesError('Password recovery requires password replacement without the current password.');
    }
    if (selected.createPassword && !selected.createAccount) {
        throw new ZynoSalesError('Password creation requires account registration.');
    }
    if (!selected.passwordLogin && !selected.otpLogin) {
        throw new ZynoSalesError('At least one customer login method must be enabled.');
    }
}

function requireOption(options: ISalesEcommCustomerAuthOptions, option: keyof ISalesEcommCustomerAuthOptions): void {
    if (!options[option]) throw new ZynoSalesError('That customer flow is not enabled for this session.', { status: 403, code: 'AUTH_OPTION_DISABLED' });
}

function stateForSession(session: ISalesEcommCustomerSession): CustomerSnapshot['state'] {
    if (session.targetCartId) return 'cart-resume';
    if (session.phase === 'authenticated') return 'authenticated';
    if (session.phase === 'anonymous') return 'anonymous';
    return 'restricted';
}

function isLocallyExpired(session: Pick<ISalesEcommCustomerSession, 'expiresAt' | 'idleExpiresAt'>): boolean {
    const absoluteExpiry = Date.parse(session.expiresAt);
    const idleExpiry = Date.parse(session.idleExpiresAt);
    const now = Date.now();
    return !Number.isFinite(absoluteExpiry) || !Number.isFinite(idleExpiry) || now >= absoluteExpiry || now >= idleExpiry;
}

function currentOrigin(): string | null {
    return typeof location === 'undefined' ? null : location.origin;
}

function sameOptions(left: ISalesEcommCustomerAuthOptions, right: ISalesEcommCustomerAuthOptions): boolean {
    return (Object.keys(left) as Array<keyof ISalesEcommCustomerAuthOptions>).every(key => left[key] === right[key]);
}

function samePolicy(
    current: Pick<ISalesEcommCustomerSession, 'policy' | 'targetCartId'>,
    previous: Pick<ISalesEcommCustomerSession, 'policy' | 'targetCartId'>
): boolean {
    return current.policy.policyId === previous.policy.policyId
        && current.policy.policyRevision === previous.policy.policyRevision
        && current.policy.digest === previous.policy.digest
        && sameOptions(current.policy.options, previous.policy.options)
        && current.policy.orderHistoryScope === previous.policy.orderHistoryScope
        && current.policy.orderHistoryConfigRevision === previous.policy.orderHistoryConfigRevision;
}

function persistedSession(session: ISalesEcommCustomerSession): Omit<ISalesEcommCustomerSession, 'principal'> {
    const { principal: _principal, ...metadata } = session;
    return metadata;
}

function parsePersistedRecord(value: string): PersistedCustomerSession | null {
    try {
        const parsed = JSON.parse(value) as Partial<PersistedCustomerSession>;
        if (parsed.version !== 1 || typeof parsed.sessionSecret !== 'string'
            || typeof parsed.apiBase !== 'string' || typeof parsed.namespace !== 'string'
            || typeof parsed.keyIdentity !== 'string' || typeof parsed.restricted !== 'boolean'
            || !parsed.session || typeof parsed.session !== 'object'
            || typeof parsed.session.sessionId !== 'string' || !parsed.session.policy) return null;
        return parsed as PersistedCustomerSession;
    } catch {
        return null;
    }
}

function sameSavedSessionIdentity(left: PersistedCustomerSession, right: PersistedCustomerSession): boolean {
    return left.apiBase === right.apiBase
        && left.namespace === right.namespace
        && left.keyIdentity === right.keyIdentity
        && left.origin === right.origin
        && left.restricted === right.restricted
        && left.sessionSecret === right.sessionSecret
        && left.session.sessionId === right.session.sessionId
        && left.session.phase === right.session.phase
        && left.session.targetCartId === right.session.targetCartId
        && samePolicy(left.session, right.session);
}

function sameSavedSessionSnapshot(left: PersistedCustomerSession, right: PersistedCustomerSession): boolean {
    return sameSavedSessionIdentity(left, right)
        && left.session.expiresAt === right.session.expiresAt
        && left.session.idleExpiresAt === right.session.idleExpiresAt;
}

function policyMismatch(): ZynoSalesError {
    return new ZynoSalesError('This customer session belongs to a different storefront policy. Sign in again.', {
        status: 409,
        code: 'AUTH_POLICY_MISMATCH'
    });
}

function invalidatedInAnotherTab(): ZynoSalesError {
    return new ZynoSalesError('This customer session changed in another tab. Restore it before continuing.', {
        status: 401,
        code: 'REAUTHENTICATION_REQUIRED'
    });
}

function isTerminalSessionError(error: unknown): boolean {
    if (!(error instanceof ZynoSalesError)) return false;
    return error.code === 'REAUTHENTICATION_REQUIRED'
        || error.code === 'AUTH_POLICY_MISMATCH'
        || error.code === 'STOREFRONT_CONFIG_CHANGED';
}
