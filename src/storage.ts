/** Minimal storage interface accepted by the SDK. */
export interface ZynoSalesStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

class MemoryStorage implements ZynoSalesStorage {
    private readonly values = new Map<string, string>();

    public getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    public setItem(key: string, value: string): void {
        this.values.set(key, value);
    }

    public removeItem(key: string): void {
        this.values.delete(key);
    }
}

export type BrowserStorageMode = 'session' | 'local' | 'memory' | 'custom';

/** A storage adapter and the persistence level it provides. */
export type ResolvedCustomerStorage = {
    storage: ZynoSalesStorage;
    mode: BrowserStorageMode;
};

/** Uses browser storage when it can be safely accessed, otherwise an in-memory store. */
export function defaultPersistentStorage(): ZynoSalesStorage {
    if (typeof window === 'undefined') return new MemoryStorage();

    try {
        const storage = window.localStorage;
        const key = '__zynosales_ecommerce_probe__';
        storage.setItem(key, '1');
        storage.removeItem(key);
        return storage;
    } catch {
        return new MemoryStorage();
    }
}

/** Uses session storage when it can be safely accessed, otherwise an in-memory store. */
export function defaultSessionStorage(): ZynoSalesStorage {
    if (typeof window === 'undefined') return new MemoryStorage();

    try {
        const storage = window.sessionStorage;
        const key = '__zynosales_ecommerce_probe__';
        storage.setItem(key, '1');
        storage.removeItem(key);
        return storage;
    } catch {
        return new MemoryStorage();
    }
}

/** Uses local storage for ordinary customer sessions, with an in-memory fallback when browser storage is unavailable. */
export function resolveCustomerSessionStorage(storage?: ZynoSalesStorage): ResolvedCustomerStorage {
    if (storage) {
        if (typeof window !== 'undefined') {
            try {
                if (storage === window.sessionStorage) return { storage, mode: 'session' };
                if (storage === window.localStorage) return { storage, mode: 'local' };
            } catch {
                // A supplied adapter can still work even when browser storage is blocked.
            }
        }
        return { storage, mode: 'custom' };
    }
    if (typeof window === 'undefined') return { storage: new MemoryStorage(), mode: 'memory' };

    try {
        const candidate = window.localStorage;
        const key = '__zynosales_customer_probe__';
        candidate.setItem(key, '1');
        candidate.removeItem(key);
        return { storage: candidate, mode: 'local' };
    } catch {
        return { storage: new MemoryStorage(), mode: 'memory' };
    }
}
