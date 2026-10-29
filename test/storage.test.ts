import { describe, expect, it } from 'vitest';

import { resolveCustomerSessionStorage, type ZynoSalesStorage } from '../src/storage';

describe('customer session storage', () => {
    it('reports the in-memory fallback for non-browser hosts', () => {
        const resolved = resolveCustomerSessionStorage();

        expect(resolved.mode).toBe('memory');
        expect(resolved.storage.getItem('missing')).toBeNull();
    });

    it('accepts a caller-selected adapter for cross-tab persistence', () => {
        const values = new Map<string, string>();
        const custom: ZynoSalesStorage = {
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: key => values.delete(key)
        };

        const resolved = resolveCustomerSessionStorage(custom);
        resolved.storage.setItem('session', 'opaque');

        expect(resolved.mode).toBe('custom');
        expect(custom.getItem('session')).toBe('opaque');
    });
});
