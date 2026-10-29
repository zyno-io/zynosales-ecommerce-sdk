import { describe, expect, it, vi } from 'vitest';

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

    it('defaults ordinary customer sessions to localStorage and allows explicit tab-only storage', () => {
        const makeStorage = (): ZynoSalesStorage => {
            const values = new Map<string, string>();
            return {
                getItem: key => values.get(key) ?? null,
                setItem: (key, value) => values.set(key, value),
                removeItem: key => values.delete(key)
            };
        };
        const localStorage = makeStorage();
        const sessionStorage = makeStorage();
        vi.stubGlobal('window', { localStorage, sessionStorage });

        try {
            const normal = resolveCustomerSessionStorage();
            const tabOnly = resolveCustomerSessionStorage(sessionStorage);

            expect(normal).toEqual({ storage: localStorage, mode: 'local' });
            expect(tabOnly).toEqual({ storage: sessionStorage, mode: 'session' });
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('falls back to memory when localStorage is unavailable', () => {
        const values = new Map<string, string>();
        const sessionStorage: ZynoSalesStorage = {
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: key => values.delete(key)
        };
        const browser = { sessionStorage };
        Object.defineProperty(browser, 'localStorage', { get: () => { throw new Error('blocked'); } });
        vi.stubGlobal('window', browser);

        try {
            const resolved = resolveCustomerSessionStorage();
            resolved.storage.setItem('session', 'opaque');

            expect(resolved.mode).toBe('memory');
            expect(values.get('session')).toBeUndefined();
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
