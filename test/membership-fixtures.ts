import type { ISalesMembershipCheckoutTerms } from '../src';

export const membershipTerms: ISalesMembershipCheckoutTerms = {
    membershipTypeId: 'membership-type',
    pricingTierId: 'tier-monthly',
    name: 'Monthly membership',
    initialPrice: 0,
    renewalPrice: 2500,
    subscriptionPeriod: 'month',
    subscriptionRecurs: true,
    validityValue: null,
    validityUnits: null,
    termsHash: 'accepted-server-terms'
};
