import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import type { Product } from '../../src/api/models/product';
import { missingProductId, notebook, seedProducts, testProductCategory } from '../../src/shared/data/products';
import { formatUsd } from '../../src/shared/helpers/format';

/** Drops the fields that UI tests change by buying and reviewing seed products. */
const withoutVolatile = ({
  stock: _stock, updatedAt: _updatedAt, averageRating: _rating, reviewCount: _count, version, ...product
}: Product) => {
  expect(Number.isInteger(version)).toBe(true);
  expect(version).toBeGreaterThanOrEqual(1);
  return product;
};

// Catalog reads are public, so most tests send no token.
test.describe('Product catalog', () => {
  // Lists the whole catalog and checks that it holds exactly the 8 seed products, in order, with their real data.
  // Products that parallel API tests create are left out by their test category.
  test('lists every seed product', async ({ productService }) => {
    const catalog = await productService.list({ limit: 100 });
    expect(catalog.page).toEqual({ limit: 100, offset: 0, hasMore: false, nextCursor: null });
    const seeds = catalog.items.filter(item => item.category !== testProductCategory).map(withoutVolatile);
    expect(seeds).toEqual(seedProducts);
  });

  // Opens the notebook by id and checks its exact seed data and the price the UI shows.
  test('shows the details of a single product', async ({ productService }) => {
    const { reviews, ...product } = await productService.get(notebook.id);
    expect(withoutVolatile(product)).toEqual(seedProducts[2]);
    expect(reviews).toHaveLength(product.reviewCount);
    expect(formatUsd(product.priceCents)).toBe(notebook.price);
  });

  // Searches by an exact product name and expects only that product.
  // No limit or offset is sent, so the page must show the defaults: 12 items from offset 0.
  test('finds a product by name', async ({ productService }) => {
    const catalog = await productService.search(notebook.name);
    expect(catalog.items.map(withoutVolatile)).toEqual([seedProducts[2]]);
    expect(catalog.page).toEqual({ limit: 12, offset: 0, hasMore: false, nextCursor: null });
  });

  // The admin creates two products with a unique name, then the test pages through them one at a time.
  // Searching by that unique name keeps products from parallel tests out of the pages.
  // Newest products come first, so page 1 holds the second product and page 2 the first.
  // The cursor after page 1 is the base64url form of the last id shown.
  test('pages through results with limit and offset', async ({ productService, adminToken }) => {
    const suffix = randomUUID();
    const search = `pagination-${suffix}`;
    const created: string[] = [];
    try {
      for (const index of [1, 2]) {
        const product = await productService.create({
          sku: `PAGINATION-${suffix}-${index}`,
          slug: `pagination-${suffix}-${index}`,
          name: `${search}-${index}`,
          description: 'Isolated product for pagination testing.',
          category: testProductCategory,
          priceCents: 1000,
        }, adminToken);
        created.push(product.id);
      }

      const first = await productService.list({ search, limit: 1, offset: 0 });
      expect(first.items.map(item => item.id)).toEqual([created[1]]);
      expect(first.page).toEqual({
        limit: 1, offset: 0, hasMore: true, nextCursor: Buffer.from(created[1]).toString('base64url'),
      });

      const second = await productService.list({ search, limit: 1, offset: 1 });
      expect(second.items.map(item => item.id)).toEqual([created[0]]);
      expect(second.page).toEqual({ limit: 1, offset: 1, hasMore: false, nextCursor: null });
    } finally {
      for (const productId of created) {
        await productService.archive(productId, adminToken);
      }
    }
  });

  // Requests a product id that does not exist and expects 404 PRODUCT_NOT_FOUND.
  test('returns not found for an unknown product', async ({ productsApi }) => {
    await expectError(await productsApi.getById(missingProductId), 404, 'PRODUCT_NOT_FOUND');
  });
});
