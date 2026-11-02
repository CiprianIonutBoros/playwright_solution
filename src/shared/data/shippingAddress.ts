import type { ShippingAddress as OrderShippingAddress } from '../../api/models/order';

export const orderShippingAddress: OrderShippingAddress = {
    line1: '42 Test Street',
    city: 'Portland',
    region: 'OR',
    postalCode: '97201',
    country: 'US',
};

const shippingLocations = [
    { city: 'Portland', region: 'OR', postalCode: '97201' },
    { city: 'Seattle', region: 'WA', postalCode: '98101' },
    { city: 'San Francisco', region: 'CA', postalCode: '94102' },
    { city: 'Austin', region: 'TX', postalCode: '78701' },
    { city: 'Boston', region: 'MA', postalCode: '02108' },
] as const;

const streetNames = ['Main Street', 'Oak Avenue', 'Cedar Lane', 'Maple Street'] as const;

export type ShippingAddress = {
    street: string;
    city: (typeof shippingLocations)[number]['city'];
    region: (typeof shippingLocations)[number]['region'];
    postalCode: (typeof shippingLocations)[number]['postalCode'];
    country: 'US';
};

export function createRandomShippingAddress(): ShippingAddress {
    const location = shippingLocations[Math.floor(Math.random() * shippingLocations.length)];
    const streetNumber = Math.floor(Math.random() * 9990) + 10;
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];

    return {
        street: `${streetNumber} ${streetName}`,
        ...location,
        country: 'US',
    };
}
