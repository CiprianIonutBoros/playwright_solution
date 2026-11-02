export const notebook = {
    id: 'p-103',
    name: 'Layflat Desk Notebook',
    price: '$18.90',
    description:
        'An undated, layflat notebook with recycled pages. Made for everyday use and designed to age beautifully.',
    sku: 'DEMO OBJECTS / SKU-103',
    category: 'Stationery',
} as const;
export const missingProductId = 'does-not-exist';
export type Product = typeof notebook;

/** Category used by every product the API tests create; seed products never use it. */
export const testProductCategory = 'API tests';

const seedCreatedAt = '2026-10-01T14:35:18.171Z';

/**
 * Seed catalog after a lab reset, in catalog order.
 * Stock, update time, and rating are left out, because UI tests buy and review seed products.
 * Version is also omitted because inventory changes advance it.
 */
export const seedProducts = [
    seed('p-101', 'SKU-101', 'ceramic-mug', 'Ceramic Pour-Over Mug', 'A handmade stoneware mug for slow mornings.', 'Home', 4990, 'mug'),
    seed('p-102', 'SKU-102', 'canvas-tote', 'Everyday Canvas Tote', 'A sturdy cotton tote with room for the essentials.', 'Accessories', 2890, 'tote'),
    seed('p-103', 'SKU-103', 'desk-notebook', 'Layflat Desk Notebook', 'An undated, layflat notebook with recycled pages.', 'Stationery', 1890, 'notebook'),
    seed('p-104', 'SKU-104', 'linen-throw', 'Soft Linen Throw', 'A light, breathable throw woven from natural linen.', 'Home', 8490, 'throw'),
    seed('p-105', 'SKU-105', 'steel-bottle', 'Insulated Steel Bottle', 'A double-wall bottle that keeps drinks cold all day.', 'Outdoors', 3590, 'bottle'),
    seed('p-106', 'SKU-106', 'desk-lamp', 'Adjustable Desk Lamp', 'A compact task lamp with a warm, focused beam.', 'Home', 7290, 'lamp'),
    seed('p-107', 'SKU-107', 'cotton-cap', 'Everyday Cotton Cap', 'A comfortable cotton cap with an adjustable strap.', 'Accessories', 2590, 'cap'),
    seed('p-108', 'SKU-108', 'field-journal', 'Pocket Field Journal', 'A pocket-sized journal for notes on the go.', 'Stationery', 1490, 'journal'),
];

function seed(id: string, sku: string, slug: string, name: string, description: string, category: string, priceCents: number, image: string) {
    return {
        id, sku, slug, name, description, category, priceCents,
        currency: 'USD', imagePath: `/products/${image}.svg`, archived: false, createdAt: seedCreatedAt,
    };
}

/** Flat shipping the store charges on bags under the $75.00 free-shipping threshold. */
export const standardShippingCents = 600;

export const orderTotals = {
    shipping: '$6.00',
    total: '$24.90',
} as const;
