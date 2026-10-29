/** A browser-safe error returned by the ZynoSales SDK. */
export class ZynoSalesError extends Error {
    /** HTTP status when a response was received. */
    public readonly status?: number;

    /** Whether the stored cart or order capability can no longer be used. */
    public readonly isCapabilityLost: boolean;

    /** Stable Sales error code when one was returned. */
    public readonly code?: string;

    /** Whether this error is a likely transient transport failure. */
    public readonly isNetworkError: boolean;

    public constructor(message: string, options: { status?: number; code?: string; cause?: unknown } = {}) {
        super(message, options.cause === undefined ? undefined : { cause: options.cause });
        this.name = 'ZynoSalesError';
        this.status = options.status;
        this.code = options.code;
        this.isCapabilityLost = options.status === 404;
        this.isNetworkError = options.status === undefined;
    }
}

/** A render-safe representation of an SDK error. */
export type PublicError = {
    /** Display-safe message suitable for checkout UI. */
    message: string;
    /** HTTP status when a response was received. */
    status?: number;
    /** Stable, non-secret business error code for UI flow selection. */
    code?: string;
    /**
     * - `network`: transport failure; local capability is usually retained
     * - `capability-lost`: cart/order capability is no longer valid
     * - `api`: validated business or request error
     */
    kind: 'api' | 'capability-lost' | 'network';
};

/** Converts unknown transport failures to errors that are safe to render. */
export function toZynoSalesError(error: unknown, status?: number): ZynoSalesError {
    if (error instanceof ZynoSalesError) return error;

    const message = messageFromErrorBody(error, status);
    const code = errorCode(error);
    return new ZynoSalesError(message, { status, code, cause: error });
}

/** Converts an SDK error to a display-safe error without capabilities, PII, or API internals. */
export function toPublicError(error: unknown): PublicError {
    const normalized = toZynoSalesError(error);
    if (normalized.isCapabilityLost) {
        return { kind: 'capability-lost', message: 'Your saved cart is no longer available.', status: normalized.status, code: normalized.code };
    }
    if (normalized.isNetworkError) {
        return { kind: 'network', message: 'We could not reach checkout. Please try again.', status: normalized.status, code: normalized.code };
    }
    return { kind: 'api', message: normalized.message, status: normalized.status, code: normalized.code };
}

function errorCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const record = error as Record<string, unknown>;
    const candidate = record.code ?? record.errorCode;
    return typeof candidate === 'string' ? candidate : undefined;
}

function messageFromErrorBody(error: unknown, status?: number): string {
    if (status !== undefined && status >= 500) return 'Checkout is temporarily unavailable. Please try again.';

    if (typeof error === 'object' && error !== null) {
        const record = error as Record<string, unknown>;
        for (const key of ['message', 'error'] as const) {
            const value = record[key];
            if (typeof value === 'string' && value.length > 0) return value;
        }
    }

    if (error instanceof Error && error.message) return error.message;
    return 'Checkout could not be completed.';
}
