import { describe, expect, it } from 'vitest';

import { parseCartReference, parseCompletedOrderReference } from '../src/references';

const scope = {
    policyId: 'policy-1',
    policyRevision: 4,
    orderHistoryScope: 'ecomm' as const
};

describe('persisted cart and order references', () => {
    it('migrates old untagged references as guest mode', () => {
        expect(parseCartReference(JSON.stringify({ cartId: 'cart', cartKey: 'cap', orderKey: 'order-cap' }))).toEqual({
            version: 1, mode: 'guest', cartId: 'cart', cartKey: 'cap', orderKey: 'order-cap'
        });
        expect(parseCompletedOrderReference(JSON.stringify({ cartId: 'cart', orderId: 'order', orderKey: 'order-cap' }))).toEqual({
            version: 1, mode: 'guest', cartId: 'cart', orderId: 'order', orderKey: 'order-cap'
        });
    });

    it('drops any stale guest order key while parsing account mode', () => {
        const cart = parseCartReference(JSON.stringify({
            version: 2, mode: 'account', cartId: 'cart', cartKey: 'cap', orderKey: 'stale', scope
        }));
        const order = parseCompletedOrderReference(JSON.stringify({
            version: 2, mode: 'account', cartId: 'cart', orderId: 'order', orderKey: 'stale', scope
        }));

        expect(cart).toEqual({ version: 2, mode: 'account', cartId: 'cart', cartKey: 'cap', scope });
        expect(order).toEqual({ version: 2, mode: 'account', cartId: 'cart', orderId: 'order', scope });
        expect(cart && 'orderKey' in cart).toBe(false);
        expect(order && 'orderKey' in order).toBe(false);
    });

    it('rejects malformed or ambiguous references', () => {
        expect(parseCartReference('{')).toBeNull();
        expect(parseCartReference(JSON.stringify({ version: 3, mode: 'account', cartId: 'cart', cartKey: 'cap', scope }))).toBeNull();
        expect(parseCompletedOrderReference(JSON.stringify({ version: 2, mode: 'account', cartId: 'cart', orderId: 'order' }))).toBeNull();
    });
});
