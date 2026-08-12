/** @hidden */
export const SALES_API_BASES = {
    production: 'https://sales.api.zyno.app',
    alpha: 'https://sales.api-alpha.zyno.dev'
} as const;

/** @hidden */
export type ZynoSalesEnvironment = keyof typeof SALES_API_BASES;

/** @hidden */
export function resolveApiBase(environment: ZynoSalesEnvironment = 'production', apiBase?: string): string {
    const candidate = apiBase ?? SALES_API_BASES[environment];
    const parsed = new URL(candidate);
    const isLocalHttp = parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

    if (parsed.protocol !== 'https:' && !isLocalHttp) {
        throw new Error('ZynoSales apiBase must use HTTPS, except for localhost development.');
    }

    return parsed.toString().replace(/\/$/, '');
}

/** Produces a storage-safe namespace that cannot collide across API bases or storefronts. */
export function storageNamespace(apiBase: string, tenantId?: string): string {
    const encodedBase = encodeURIComponent(apiBase);
    const encodedTenant = tenantId ? encodeURIComponent(tenantId) : 'unresolved';
    return `zynosales:ecommerce:${encodedBase}:${encodedTenant}`;
}
