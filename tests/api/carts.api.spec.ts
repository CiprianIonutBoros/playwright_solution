import { test, expect } from '../../src/fixtures/api';
import { expectError } from '../../src/api/helpers/accounts';
import { isIsoTimestamp, opaqueTokenPattern, uuidPattern } from '../../src/shared/data/formats';

// Customer carts use the customer token. Guest carts use their own cart token until they are attached.
test.describe('Shopping cart', () => {
  // The customer gets a new empty cart, adds 2 units at $25.00, changes the quantity to 3, then removes the item.
  // After each step the cart is read back to check the exact item, quantity, and subtotal.
  test('customer can add, change, and remove an item', async ({ cartService, customerToken, stockedProduct }) => {
    const owner = { accessToken: customerToken };
    const cart = await cartService.createForCustomer(customerToken);
    expect(cart.id).toMatch(uuidPattern);
    expect(isIsoTimestamp(cart.createdAt ?? '')).toBe(true);
    expect(cart).toEqual({ id: cart.id, status: 'active', createdAt: cart.createdAt, items: [], subtotalCents: 0 });

    const added = await cartService.addItem(cart.id, stockedProduct.id, 2, owner);
    expect(added.id).toMatch(uuidPattern);
    expect(added).toEqual({
      id: added.id, productId: stockedProduct.id, name: stockedProduct.name, quantity: 2, unitPriceCents: 2500, lineTotalCents: 5000,
    });
    expect(await cartService.get(cart.id, owner)).toMatchObject({
      id: cart.id,
      status: 'active',
      items: [{ id: added.id, productId: stockedProduct.id, name: stockedProduct.name, quantity: 2, unitPriceCents: 2500, lineTotalCents: 5000 }],
      subtotalCents: 5000,
    });

    await cartService.updateItem(cart.id, added.id, 3, owner);
    expect(await cartService.get(cart.id, owner)).toMatchObject({
      items: [{ id: added.id, quantity: 3, unitPriceCents: 2500, lineTotalCents: 7500 }], subtotalCents: 7500,
    });

    await cartService.removeItem(cart.id, added.id, owner);
    expect(await cartService.get(cart.id, owner)).toMatchObject({ id: cart.id, status: 'active', items: [], subtotalCents: 0 });
  });

  // A guest gets an empty cart with a 64-character cart token and fills it using that token.
  // The customer then attaches it and must own the same cart with the guest's item still in it.
  test('guest cart keeps its items after the customer attaches it', async ({ cartService, customerToken, stockedProduct }) => {
    const guest = await cartService.createGuest();
    expect(guest.accessToken).toMatch(opaqueTokenPattern);
    expect(guest).toEqual({
      id: guest.id, status: 'active', createdAt: guest.createdAt, items: [], subtotalCents: 0, accessToken: guest.accessToken,
    });
    const added = await cartService.addItem(guest.id, stockedProduct.id, 1, { cartToken: guest.accessToken });

    await cartService.attach(guest.id, guest.accessToken, customerToken);
    const owner = { accessToken: customerToken };
    expect(await cartService.get(guest.id, owner)).toMatchObject({
      id: guest.id,
      status: 'active',
      items: [{ id: added.id, productId: stockedProduct.id, quantity: 1, unitPriceCents: 2500, lineTotalCents: 2500 }],
      subtotalCents: 2500,
    });
    await cartService.removeItem(guest.id, added.id, owner);
    expect(await cartService.listItems(guest.id, owner)).toEqual([]);
  });

  // Reads a customer's cart with no token. The API hides it with 404 CART_NOT_FOUND.
  test('cart cannot be read without the owner token', async ({ cartService, cartsApi, customerToken }) => {
    const cart = await cartService.createForCustomer(customerToken);
    await expectError(await cartsApi.getById(cart.id), 404, 'CART_NOT_FOUND');
  });

  // The customer adds 0 units. The API must reject it with 400 and keep the cart empty.
  test('zero quantity is rejected', async ({ cartService, cartsApi, customerToken, stockedProduct }) => {
    const cart = await cartService.createForCustomer(customerToken);
    await expectError(await cartsApi.addItem(cart.id, stockedProduct.id, 0, customerToken), 400, 'FST_ERR_VALIDATION');
    expect(await cartService.listItems(cart.id, { accessToken: customerToken })).toEqual([]);
  });
});
