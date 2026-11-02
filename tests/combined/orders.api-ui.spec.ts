import { test, expect } from '../../src/fixtures/api';
import type { Page } from '@playwright/test';
import type { PlacedOrder } from '../../src/api/models/order';
import { formatUsd } from '../../src/shared/helpers/format';
import { signInWithSession } from '../../src/ui/helpers/sessionBridge';

// Each test gets its own order from the API fixtures: a fresh $25.00 product with 20 units in stock (stockedProduct),
// and an order for 2 of them placed by the shared customer (placedOrder). The fixtures archive the product and
// cancel the order afterwards if it is still cancellable, so tests never share or leave behind data.
// The API sets up the data, and the browser must show exactly that data.
// When the browser changes an order, the API must report the same change.
// Status chips hold the raw API status (for example "confirmed"); CSS only capitalizes it on screen.

/** Formats the order time the way the store does, in the browser's own locale and time zone. */
async function placedDates(page: Page, order: PlacedOrder): Promise<{ short: string; long: string }> {
  return page.evaluate(iso => {
    const date = new Date(iso);
    const day = (month: 'short' | 'long') => date.toLocaleDateString('en-US', { month, day: 'numeric', year: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { short: day('short'), long: `Placed ${day('long')} at ${time}` };
  }, order.createdAt);
}

test.describe('Order history', () => {
  // The API places an order for 2 x $25.00 with $6.00 shipping.
  // The order history must list it once, with its number, placed date, status, the $56.00 total, and a link to its details.
  test('order placed through the API is listed in the order history', async ({
    page, customerSession, placedOrder, orderHistoryPage,
  }) => {
    expect(placedOrder.totalCents).toBe(5600);
    await signInWithSession(page, customerSession, { path: '/orders' });

    const { short } = await placedDates(page, placedOrder);
    await expect(orderHistoryPage.orderRow(placedOrder.orderNumber)).toHaveCount(1);
    await expect(orderHistoryPage.orderNumber(placedOrder.orderNumber)).toHaveText(placedOrder.orderNumber);
    await expect(orderHistoryPage.placedDate(placedOrder.orderNumber)).toHaveText(short);
    await expect(orderHistoryPage.status(placedOrder.orderNumber)).toHaveText(placedOrder.status);
    await expect(orderHistoryPage.total(placedOrder.orderNumber)).toHaveText(formatUsd(placedOrder.totalCents));
    await expect(orderHistoryPage.detailsLink(placedOrder.orderNumber)).toHaveAttribute('href', `/orders/${placedOrder.id}`);
  });

  // Opens the order from its "Details" link. The page must show exactly what the API returned:
  // number, placed time, status, the single item line, the delivery address, and the payment totals.
  test('order details match the order returned by the API', async ({
    page, customerSession, placedOrder, stockedProduct, orderService, orderHistoryPage, orderDetailsPage,
  }) => {
    const order = await orderService.get(placedOrder.id, customerSession.accessToken);
    const [line] = order.items;
    const address = order.shippingAddress;

    await signInWithSession(page, customerSession, { path: '/orders' });
    await orderHistoryPage.openOrderDetails(order.orderNumber);
    await expect(page).toHaveURL(`/orders/${order.id}`);

    const { long } = await placedDates(page, placedOrder);
    await expect(orderDetailsPage.orderNumber).toHaveText(`ORDER ${order.orderNumber}`);
    await expect(orderDetailsPage.placedDate).toHaveText(long);
    await expect(orderDetailsPage.status).toHaveText('confirmed');
    await expect(orderDetailsPage.status).toHaveAttribute('data-testid', `order-status-${order.id}`);

    await expect(orderDetailsPage.items).toHaveCount(1);
    await expect(orderDetailsPage.itemName(stockedProduct.name)).toHaveText(line.productName);
    await expect(orderDetailsPage.itemQuantity(stockedProduct.name)).toHaveText(`Qty ${line.quantity}`);
    await expect(orderDetailsPage.itemTotal(stockedProduct.name)).toHaveText(formatUsd(line.lineTotalCents));

    await expect(orderDetailsPage.deliveryAddress).toBeVisible();
    expect(await orderDetailsPage.deliveryAddress.innerText()).toBe(
      `${address.line1}\n${address.city} ${address.region} ${address.postalCode}\n${address.country}`,
    );
    await expect(orderDetailsPage.subtotal).toHaveText(formatUsd(order.subtotalCents));
    await expect(orderDetailsPage.shipping).toHaveText(formatUsd(order.shippingCents));
    await expect(orderDetailsPage.total).toHaveText(formatUsd(order.totalCents));
    await expect(orderDetailsPage.cancelOrderButton).toBeVisible();
  });
});

test.describe('Cancel an order', () => {
  // The order starts confirmed with 18 of 20 units left in stock.
  // The customer clicks "Cancel this order"; the browser prompt must read exactly "Cancel order <number>?" and is accepted.
  // The API must then report status "cancelled" and stock back at exactly 20.
  // The page must show "cancelled" and no longer offer the cancel button.
  test('order cancelled in the browser is cancelled in the API and stock is restored', async ({
    page, customerSession, placedOrder, stockedProduct, orderService, productService, orderDetailsPage,
  }) => {
    expect(await productService.get(stockedProduct.id)).toMatchObject({ stock: 18 });
    await signInWithSession(page, customerSession, { path: `/orders/${placedOrder.id}` });

    expect(await orderDetailsPage.cancelOrderAndAnswer('accept')).toBe(`confirm: Cancel order ${placedOrder.orderNumber}?`);

    await expect
      .poll(async () => (await orderService.get(placedOrder.id, customerSession.accessToken)).status)
      .toBe('cancelled');
    expect(await productService.get(stockedProduct.id)).toMatchObject({ stock: 20 });
    await expect(orderDetailsPage.status).toHaveText('cancelled');
    await expect(orderDetailsPage.cancelOrderButton).toBeHidden();
  });

  // The customer opens the same "Cancel order <number>?" prompt but dismisses it.
  // The order must stay "confirmed" in the browser and the API, the cancel button stays, and stock stays at exactly 18.
  test('dismissing the cancel prompt keeps the order', async ({
    page, customerSession, placedOrder, stockedProduct, orderService, productService, orderDetailsPage,
  }) => {
    await signInWithSession(page, customerSession, { path: `/orders/${placedOrder.id}` });

    expect(await orderDetailsPage.cancelOrderAndAnswer('dismiss')).toBe(`confirm: Cancel order ${placedOrder.orderNumber}?`);

    await expect(orderDetailsPage.status).toHaveText('confirmed');
    await expect(orderDetailsPage.cancelOrderButton).toBeVisible();
    expect(await orderService.get(placedOrder.id, customerSession.accessToken)).toMatchObject({ status: 'confirmed' });
    expect(await productService.get(stockedProduct.id)).toMatchObject({ stock: 18 });
  });
});

test.describe('Fulfilment updates', () => {
  // The customer has the confirmed order open. The admin moves it to processing, then shipped, through the API.
  // After reopening, the details page must show exactly "shipped" and no cancel button,
  // because shipped orders cannot be cancelled. The order history row must show "shipped" too.
  test('order shipped by the admin shows as shipped and can no longer be cancelled', async ({
    page, customerSession, adminToken, placedOrder, orderService, orderDetailsPage, orderHistoryPage,
  }) => {
    await signInWithSession(page, customerSession, { path: `/orders/${placedOrder.id}` });
    await expect(orderDetailsPage.status).toHaveText('confirmed');

    for (const status of ['processing', 'shipped'] as const) {
      expect(await orderService.advanceStatus(placedOrder.id, status, adminToken)).toMatchObject({ id: placedOrder.id, status });
    }
    await orderDetailsPage.open(placedOrder.id);
    await expect(orderDetailsPage.status).toHaveText('shipped');
    await expect(orderDetailsPage.cancelOrderButton).toBeHidden();

    await orderHistoryPage.open();
    await expect(orderHistoryPage.status(placedOrder.orderNumber)).toHaveText('shipped');
  });
});
