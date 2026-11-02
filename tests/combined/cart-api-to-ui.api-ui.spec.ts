import { test, expect } from '../../src/fixtures/api';
import { standardShippingCents } from '../../src/shared/data/products';
import { uuidPattern } from '../../src/shared/data/formats';
import { formatUsd } from '../../src/shared/helpers/format';
import { signInWithSession } from '../../src/ui/helpers/sessionBridge';

// Each test creates its own API cart and product. The fresh product costs $25.00 and has 20 units in stock.
// The UI must render the API data exactly. Totals stay under $75, so shipping remains the flat $6.00.
test.describe('API cart shown in the browser', () => {
  // The API adds 2 units. The bag must show one line, exact product details and quantity,
  // then the same subtotal, shipping, total, and unit count as the API cart.
  test('bag shows the exact lines and totals of the API cart', async ({
    page, customerSession, cartService, stockedProduct, shoppingBagPage,
  }) => {
    const token = customerSession.accessToken;
    const cart = await cartService.createForCustomer(token);
    expect(cart.items).toEqual([]);

    await cartService.addItem(cart.id, stockedProduct.id, 2, { accessToken: token });
    const cartWithItem = await cartService.get(cart.id, { accessToken: token });
    const subtotalCents = stockedProduct.priceCents * 2;
    const totalCents = subtotalCents + standardShippingCents;
    expect(cartWithItem.items).toHaveLength(1);
    const [item] = cartWithItem.items;
    expect(item.id).toMatch(uuidPattern);
    expect(item).toEqual({
      id: item.id,
      productId: stockedProduct.id,
      name: stockedProduct.name,
      quantity: 2,
      unitPriceCents: stockedProduct.priceCents,
      lineTotalCents: subtotalCents,
      imagePath: stockedProduct.imagePath,
      slug: stockedProduct.slug,
      stock: stockedProduct.stock,
    });
    expect(cartWithItem.subtotalCents).toBe(subtotalCents);

    await signInWithSession(page, customerSession, { cartId: cart.id, path: '/cart' });

    await expect(shoppingBagPage.items).toHaveCount(1);
    await expect(shoppingBagPage.lineCount).toHaveText('1 piece set aside for you');
    await expect(shoppingBagPage.productLink(stockedProduct.id, stockedProduct.name)).toHaveText(stockedProduct.name);
    await expect(shoppingBagPage.unitPrice(stockedProduct.id)).toHaveText(
      `${formatUsd(stockedProduct.priceCents)} · In stock`,
    );
    await expect(shoppingBagPage.quantity(stockedProduct.id)).toHaveValue('2');
    await expect(shoppingBagPage.lineTotal(stockedProduct.id)).toHaveText(formatUsd(subtotalCents));
    await expect(shoppingBagPage.subtotal).toHaveText(formatUsd(subtotalCents));
    await expect(shoppingBagPage.shippingAmount(formatUsd(standardShippingCents))).toBeVisible();
    await expect(shoppingBagPage.total).toHaveText(formatUsd(totalCents));
    await expect(shoppingBagPage.bagCount).toHaveText('2');
  });
});
