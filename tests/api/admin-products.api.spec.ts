import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp, productIdPattern } from '../../src/shared/data/formats';
import { testProductCategory } from '../../src/shared/data/products';

test.describe('Product administration', () => {
  // The admin creates a product and gets back exactly what was sent, plus the API defaults:
  // version 1, no stock, a placeholder image, and no reviews. Reading it by id returns the same record.
  // An edit with the version-1 ETag saves the change as version 2. A second edit with the old ETag fails with 412.
  // Archiving hides the product. If an assertion fails, the finally block still archives it.
  test('admin can create, edit, and archive a product', async ({ productService, productsApi, adminToken }) => {
    const suffix = randomUUID();
    const body = {
      sku: `LIFECYCLE-${suffix}`,
      slug: `lifecycle-${suffix}`,
      name: `Lifecycle product ${suffix}`,
      description: 'Product created by the API lifecycle test.',
      category: testProductCategory,
      priceCents: 1800,
    };
    const product = await productService.create(body, adminToken);
    let archived = false;
    try {
      expect(product.id).toMatch(productIdPattern);
      expect(isIsoTimestamp(product.createdAt)).toBe(true);
      expect(product).toEqual({
        ...body,
        id: product.id,
        currency: 'USD',
        stock: 0,
        version: 1,
        imagePath: '/products/product-placeholder.svg',
        archived: false,
        createdAt: product.createdAt,
        updatedAt: product.createdAt,
        averageRating: 0,
        reviewCount: 0,
        reviews: [],
      });
      const created = await productService.getWithETag(product.id);
      expect(created).toEqual({ product, etag: `W/"product-${product.id}-v1"` });

      const changes = { name: `${body.name} updated`, priceCents: 2100 };
      const updated = await productService.update(product.id, changes, adminToken, created.etag);
      expect(isIsoTimestamp(updated.updatedAt)).toBe(true);
      expect(updated).toEqual({ ...product, ...changes, version: 2, updatedAt: updated.updatedAt });
      expect(await productService.getWithETag(product.id)).toEqual({
        product: updated, etag: `W/"product-${product.id}-v2"`,
      });

      await expectError(await productsApi.update(product.id, { priceCents: 1 }, adminToken, created.etag), 412, 'PRECONDITION_FAILED');
      expect(await productService.get(product.id)).toEqual(updated);

      await productService.archive(product.id, adminToken);
      archived = true;
      await expectError(await productsApi.getById(product.id), 404, 'PRODUCT_NOT_FOUND');
    } finally {
      if (!archived) {
        await productService.archive(product.id, adminToken);
      }
    }
  });

  // A customer tries to change a product price. The API must answer 403 and leave the product unchanged.
  test('customer cannot edit a product', async ({ productService, productsApi, customerToken, stockedProduct }) => {
    await expectError(await productsApi.update(stockedProduct.id, { priceCents: 1 }, customerToken), 403, 'FORBIDDEN');
    expect(await productService.get(stockedProduct.id)).toEqual(stockedProduct);
  });
});
