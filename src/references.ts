/** Safe identifiers retained with an account-bound cart for explicit recovery. */
export type AccountReferenceScope = {
    policyId: string;
    policyRevision: number;
    orderHistoryScope: 'ecomm' | 'all';
};

export type GuestCartReference = {
    version: 1;
    mode: 'guest';
    cartId: string;
    cartKey: string;
    orderKey: string;
};

export type AccountCartReference = {
    version: 2;
    mode: 'account';
    cartId: string;
    cartKey: string;
    scope: AccountReferenceScope;
};

export type CartReference = GuestCartReference | AccountCartReference;

export type GuestCompletedOrderReference = {
    version: 1;
    mode: 'guest';
    cartId: string;
    orderId: string;
    orderKey: string;
};

export type AccountCompletedOrderReference = {
    version: 2;
    mode: 'account';
    cartId: string;
    orderId: string;
    scope: AccountReferenceScope;
};

export type CompletedOrderReference = GuestCompletedOrderReference | AccountCompletedOrderReference;

/** Reads versioned references and migrates legacy untagged capabilities as guest references. */
export function parseCartReference(value: string | null): CartReference | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (typeof parsed.cartId !== 'string' || typeof parsed.cartKey !== 'string') return null;

        if (parsed.version === 2 && parsed.mode === 'account') {
            const scope = parseScope(parsed.scope);
            return scope ? { version: 2, mode: 'account', cartId: parsed.cartId, cartKey: parsed.cartKey, scope } : null;
        }

        if (parsed.version === 1 && parsed.mode === 'guest') {
            return typeof parsed.orderKey === 'string'
                ? { version: 1, mode: 'guest', cartId: parsed.cartId, cartKey: parsed.cartKey, orderKey: parsed.orderKey }
                : null;
        }

        // Before the mode marker shipped, all stored carts were guest carts.
        if (parsed.version === undefined && parsed.mode === undefined && typeof parsed.orderKey === 'string') {
            return { version: 1, mode: 'guest', cartId: parsed.cartId, cartKey: parsed.cartKey, orderKey: parsed.orderKey };
        }
        return null;
    } catch {
        return null;
    }
}

/** Reads versioned completed-order references and preserves legacy guest access. */
export function parseCompletedOrderReference(value: string | null): CompletedOrderReference | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value) as Record<string, unknown>;
        if (typeof parsed.cartId !== 'string' || typeof parsed.orderId !== 'string') return null;

        if (parsed.version === 2 && parsed.mode === 'account') {
            const scope = parseScope(parsed.scope);
            return scope ? { version: 2, mode: 'account', cartId: parsed.cartId, orderId: parsed.orderId, scope } : null;
        }
        if (parsed.version === 1 && parsed.mode === 'guest') {
            return typeof parsed.orderKey === 'string'
                ? { version: 1, mode: 'guest', cartId: parsed.cartId, orderId: parsed.orderId, orderKey: parsed.orderKey }
                : null;
        }
        if (parsed.version === undefined && parsed.mode === undefined && typeof parsed.orderKey === 'string') {
            return { version: 1, mode: 'guest', cartId: parsed.cartId, orderId: parsed.orderId, orderKey: parsed.orderKey };
        }
        return null;
    } catch {
        return null;
    }
}

function parseScope(value: unknown): AccountReferenceScope | null {
    if (!value || typeof value !== 'object') return null;
    const scope = value as Record<string, unknown>;
    if (typeof scope.policyId !== 'string' || typeof scope.policyRevision !== 'number'
        || (scope.orderHistoryScope !== 'ecomm' && scope.orderHistoryScope !== 'all')) return null;
    return {
        policyId: scope.policyId,
        policyRevision: scope.policyRevision,
        orderHistoryScope: scope.orderHistoryScope
    };
}
