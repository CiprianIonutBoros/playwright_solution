import { test, expect } from '../../src/fixtures/api';
import type { CartService } from '../../src/api/services/CartService';
import { standardShippingCents } from '../../src/shared/data/products';
import { formatUsd } from '../../src/shared/helpers/format';
import { readStoredCartId, signInWithSession } from '../../src/ui/helpers/sessionBridge';

// Each test starts with its own API-created cart and fresh $25.00 product with 20 units in stock.
// The browser writes cart changes asynchronously, so each API check polls until stored data matches exactly.

/** Returns the cart lines and subtotal that the UI is responsible for updating. */
async function apiLines(cartService: CartService, cartId: string, accessToken: string) {
  const cart = await cartService.get(cartId, { accessToken });
  return {
    lines: cart.items.map(({ productId, quantity, unitPriceCents, lineTotalCents }) => ({
      productId, quantity, unitPriceCents, lineTotalCents,
    })),
    subtotalCents: cart.subtotalCents,
  };
}

test.describe('Cart changes made in the browser', () => {
  // The customer adds the API-created product from its product page.
  // The browser must retain the API cart id, and the API must then contain exactly one unit at the product's price.
  // The bag must show the same line and exact subtotal, shipping, and total.
  test('adding an item in the browser updates the customer cart', async ({
    page, customerSession, cartService, stockedProduct, productPage, shoppingBagPage,
  }) => {
    const token = customerSession.accessToken;
    const cart = await cartService.createForCustomer(token);
    expect(cart.items).toEqual([]);
    await signInWithSession(page, customerSession, { cartId: cart.id });

    await productPage.open(stockedProduct.id);
    await expect(productPage.productHeading(stockedProduct.name)).toBeVisible();
    await expect(productPage.price(formatUsd(stockedProduct.priceCents))).toBeVisible();
    await productPage.addToBag();

    const unitPriceCents = stockedProduct.priceCents;
    await expect.poll(() => apiLines(cartService, cart.id, token)).toEqual({
      lines: [{ productId: stockedProduct.id, quantity: 1, unitPriceCents, lineTotalCents: unitPriceCents }],
      subtotalCents: unitPriceCents,
    });
    expect(await readStoredCartId(page)).toBe(cart.id);

    await expect(shoppingBagPage.items).toHaveCount(1);
    await expect(shoppingBagPage.productLink(stockedProduct.id, stockedProduct.name)).toHaveText(stockedProduct.name);
    await expect(shoppingBagPage.quantity(stockedProduct.id)).toHaveValue('1');
    await expect(shoppingBagPage.lineTotal(stockedProduct.id)).toHaveText(formatUsd(unitPriceCents));
    await expect(shoppingBagPage.subtotal).toHaveText(formatUsd(unitPriceCents));
    await expect(shoppingBagPage.shippingAmount(formatUsd(standardShippingCents))).toBeVisible();
    await expect(shoppingBagPage.total).toHaveText(formatUsd(unitPriceCents + standardShippingCents));
    await expect(shoppingBagPage.bagCount).toHaveText('1');
  });

  // The API starts with one unit. Changing quantity to two in the browser must persist exactly two units and their $50.00 subtotal.
  // The bag must then show the matching line total, subtotal, $56.00 total, and header count.
  test('changing quantity in the browser updates the API cart', async ({
    page, customerSession, cartService, stockedProduct, shoppingBagPage,
  }) => {
    const token = customerSession.accessToken;
    const cart = await cartService.createForCustomer(token);
    await cartService.addItem(cart.id, stockedProduct.id, 1, { accessToken: token });
    await signInWithSession(page, customerSession, { cartId: cart.id, path: '/cart' });
    await expect(shoppingBagPage.quantity(stockedProduct.id)).toHaveValue('1');

    await shoppingBagPage.setQuantity(stockedProduct.id, 2);

    const subtotalCents = stockedProduct.priceCents * 2;
    await expect.poll(() => apiLines(cartService, cart.id, token)).toEqual({
      lines: [{
        productId: stockedProduct.id, quantity: 2,
        unitPriceCents: stockedProduct.priceCents, lineTotalCents: subtotalCents,
      }],
      subtotalCents,
    });
    await expect(shoppingBagPage.lineTotal(stockedProduct.id)).toHaveText(formatUsd(subtotalCents));
    await expect(shoppingBagPage.subtotal).toHaveText(formatUsd(subtotalCents));
    await expect(shoppingBagPage.total).toHaveText(formatUsd(subtotalCents + standardShippingCents));
    await expect(shoppingBagPage.bagCount).toHaveText('2');
  });

  // The API starts with two units. Removing the line in the browser must leave an empty API cart and show the bag's exact empty state.
  test('removing an item in the browser empties the API cart', async ({
    page, customerSession, cartService, stockedProduct, shoppingBagPage,
  }) => {
    const token = customerSession.accessToken;
    const cart = await cartService.createForCustomer(token);
    await cartService.addItem(cart.id, stockedProduct.id, 2, { accessToken: token });
    await signInWithSession(page, customerSession, { cartId: cart.id, path: '/cart' });
    await expect(shoppingBagPage.items).toHaveCount(1);

    await shoppingBagPage.removeItem(stockedProduct.id);

    await expect.poll(() => apiLines(cartService, cart.id, token)).toEqual({ lines: [], subtotalCents: 0 });
    await expect(shoppingBagPage.items).toHaveCount(0);
    await expect(shoppingBagPage.lineCount).toHaveText('0 pieces set aside for you');
    await expect(shoppingBagPage.emptyMessage).toBeVisible();
  });
});
