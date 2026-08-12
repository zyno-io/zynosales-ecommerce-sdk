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
