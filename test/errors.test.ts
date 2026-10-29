import { describe, expect, it } from 'vitest';

import { toPublicError, toZynoSalesError } from '../src/errors';

describe('Sales error codes', () => {
    it('preserves stable business codes for UI flow selection', () => {
        const error = toZynoSalesError({ code: 'REAUTHENTICATION_REQUIRED', message: 'Sign in again.' }, 401);

        expect(error.code).toBe('REAUTHENTICATION_REQUIRED');
        expect(toPublicError(error)).toMatchObject({
            kind: 'api', status: 401, code: 'REAUTHENTICATION_REQUIRED', message: 'Sign in again.'
        });
    });

    it('continues to treat only 404 as a lost capability', () => {
        expect(toZynoSalesError({ code: 'REAUTHENTICATION_REQUIRED' }, 401).isCapabilityLost).toBe(false);
        expect(toZynoSalesError({}, 404).isCapabilityLost).toBe(true);
    });
});
