import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp } from '../../src/shared/data/formats';

// Stock changes need the admin token and the product's current version (optimistic locking).
test.describe('Inventory', () => {
  // The admin sets stock to 7. The response is the exact new stock level with the version bumped by one,
  // and the product shows the same stock, version, and update time.
  // Retrying with the old version must fail with 409 and keep stock at 7.
  test('admin can change stock, and a stale version is rejected', async ({
    inventoryService, inventoryApi, productService, adminToken, stockedProduct,
  }) => {
    const level = await inventoryService.setStock(stockedProduct.sku, 7, stockedProduct.version, adminToken);
    expect(isIsoTimestamp(level.updatedAt)).toBe(true);
    expect(level).toEqual({
      id: stockedProduct.id,
      sku: stockedProduct.sku,
      name: stockedProduct.name,
      stock: 7,
      version: stockedProduct.version + 1,
      updatedAt: level.updatedAt,
    });
    const afterChange = { ...stockedProduct, stock: 7, version: stockedProduct.version + 1, updatedAt: level.updatedAt };
    expect(await productService.get(stockedProduct.id)).toEqual(afterChange);

    await expectError(
      await inventoryApi.update(stockedProduct.sku, { quantity: 99, version: stockedProduct.version }, adminToken),
      409, 'VERSION_CONFLICT',
    );
    expect(await productService.get(stockedProduct.id)).toEqual(afterChange);
  });

  // A customer tries to change stock. The API must answer 403 and leave the product unchanged.
  test('customer cannot change stock', async ({ inventoryApi, productService, customerToken, stockedProduct }) => {
    await expectError(
      await inventoryApi.update(stockedProduct.sku, { quantity: 1, version: stockedProduct.version }, customerToken),
      403, 'FORBIDDEN',
    );
    expect(await productService.get(stockedProduct.id)).toEqual(stockedProduct);
  });

  // The admin sends a negative quantity. The API must reject it with 400 and leave the product unchanged.
  test('negative stock is rejected', async ({ inventoryApi, productService, adminToken, stockedProduct }) => {
    await expectError(
      await inventoryApi.update(stockedProduct.sku, { quantity: -1, version: stockedProduct.version }, adminToken),
      400, 'FST_ERR_VALIDATION',
    );
    expect(await productService.get(stockedProduct.id)).toEqual(stockedProduct);
  });
});
