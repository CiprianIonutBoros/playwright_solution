import { randomUUID } from 'node:crypto';
import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp, orderNumberPattern, uuidPattern } from '../../src/shared/data/formats';
import { orderShippingAddress as shippingAddress } from '../../src/shared/data/shippingAddress';
import { seedCustomer } from '../../src/shared/data/users';

// The customer places, reads, and cancels orders. The admin moves orders through fulfilment.
// The placedOrder fixture orders 2 units of a fresh $25.00 product and cancels the order afterwards if it still can.
test.describe('Orders', () => {
  // Checks the exact new order: 2 x $25.00 = $50.00, plus $6.00 shipping, for a $56.00 total.
  // The same order must appear in the order details and in the customer's order list.
  test('customer can place an order and find it in their orders', async ({
    orderService, customerToken, placedOrder, stockedProduct,
  }) => {
    expect(placedOrder.id).toMatch(uuidPattern);
    expect(placedOrder.orderNumber).toMatch(orderNumberPattern);
    expect(isIsoTimestamp(placedOrder.createdAt)).toBe(true);
    const line = {
      productId: stockedProduct.id, sku: stockedProduct.sku, productName: stockedProduct.name,
      quantity: 2, unitPriceCents: 2500, lineTotalCents: 5000,
    };
    const totals = {
      id: placedOrder.id, orderNumber: placedOrder.orderNumber, status: 'confirmed',
      subtotalCents: 5000, discountCents: 0, shippingCents: 600, totalCents: 5600, currency: 'USD',
      shippingAddress, createdAt: placedOrder.createdAt,
    };
    expect(placedOrder).toEqual({ ...totals, userId: seedCustomer.id, items: [line], replayed: false });

    expect(await orderService.get(placedOrder.id, customerToken)).toMatchObject({
      ...totals, customerName: seedCustomer.fullName, customerEmail: seedCustomer.email, items: [line],
    });
    const orders = await orderService.list(customerToken, { limit: 100 });
    expect(orders.items.find(order => order.id === placedOrder.id)).toEqual({ ...totals, customerName: seedCustomer.fullName });
  });

  // The order holds 2 of 20 units, so stock is 18. Cancelling must mark it cancelled and put stock back to 20.
  test('customer can cancel an order and stock is restored', async ({
    orderService, productService, customerToken, placedOrder, stockedProduct,
  }) => {
    expect(await productService.get(stockedProduct.id)).toMatchObject({ stock: 18 });
    expect(await orderService.cancel(placedOrder.id, customerToken)).toMatchObject({ id: placedOrder.id, status: 'cancelled' });
    expect(await orderService.get(placedOrder.id, customerToken)).toMatchObject({ id: placedOrder.id, status: 'cancelled' });
    expect(await productService.get(stockedProduct.id)).toMatchObject({ stock: 20 });
  });

  // The admin moves the order to processing, shipped, and delivered; the customer sees each status.
  // Once delivered, the customer's cancel must fail with 409 and the order stays delivered.
  test('admin ships the order, and a delivered order cannot be cancelled', async ({
    orderService, ordersApi, customerToken, adminToken, placedOrder,
  }) => {
    for (const status of ['processing', 'shipped', 'delivered'] as const) {
      expect(await orderService.advanceStatus(placedOrder.id, status, adminToken)).toMatchObject({ id: placedOrder.id, status });
      expect(await orderService.get(placedOrder.id, customerToken)).toMatchObject({ id: placedOrder.id, status });
    }
    await expectError(await ordersApi.cancel(placedOrder.id, customerToken), 409, 'ORDER_NOT_CANCELLABLE');
    expect(await orderService.get(placedOrder.id, customerToken)).toMatchObject({ id: placedOrder.id, status: 'delivered' });
  });

  // The customer checks out a cart with no items. The API must answer 422 EMPTY_CART.
  test('empty cart cannot be ordered', async ({ cartService, ordersApi, customerToken }) => {
    const cart = await cartService.createForCustomer(customerToken);
    await expectError(await ordersApi.create({ cartId: cart.id, shippingAddress }, customerToken), 422, 'EMPTY_CART');
  });

  // Requests an order id that does not exist and expects 404 ORDER_NOT_FOUND.
  test('returns not found for an unknown order', async ({ ordersApi, customerToken }) => {
    await expectError(await ordersApi.getById(randomUUID(), customerToken), 404, 'ORDER_NOT_FOUND');
  });
});
