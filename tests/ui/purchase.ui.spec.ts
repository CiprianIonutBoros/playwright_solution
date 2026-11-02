import { expect, test } from '../../src/fixtures/test';
import { validUser } from '../../src/shared/data/users';
import { notebook, orderTotals } from '../../src/shared/data/products';
import { createRandomShippingAddress } from '../../src/shared/data/shippingAddress';

test.describe('DemoShop UI', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('complete a purchase of the Layflat Desk Notebook', async ({
        loginPage,
        catalogPage,
        productPage,
        shoppingBagPage,
        checkoutPage,
        orderConfirmationPage,
    }) => {
        // Sign in with the seeded customer account.
        await loginPage.openFromNavigation();
        await loginPage.login(validUser.email, validUser.password);
        await expect(loginPage.signedInHeading).toBeVisible();

        // Find the notebook and inspect its product details.
        await catalogPage.open();
        await expect(catalogPage.searchInput).toBeVisible();
        await expect(catalogPage.searchInput).toBeEnabled();
        await expect(catalogPage.searchInput).toHaveAttribute(
            'placeholder',
            'Search the collection',
        );
        await expect(catalogPage.sortSelect).toBeVisible();
        await expect(catalogPage.categoryFilters).toBeVisible();
        await expect(catalogPage.results).toBeVisible();
        await catalogPage.search('Notebook');
        await expect(catalogPage.searchInput).toHaveValue('Notebook');

        const productCard = catalogPage.productCard(notebook.id);
        await expect(productCard).toBeVisible();
        await expect(catalogPage.productTitle(notebook.id)).toBeVisible();
        await expect(productCard).toContainText(notebook.category);
        await expect(productCard).toContainText(notebook.price);

        await catalogPage.openProduct(notebook.id);
        await expect(productPage.productHeading(notebook.name)).toBeVisible();
        await expect(productPage.sku(notebook.sku)).toBeVisible();
        await expect(productPage.category(notebook.category)).toBeVisible();
        await expect(productPage.description(notebook.description)).toBeVisible();
        await expect(productPage.price(notebook.price)).toBeVisible();
        await expect(productPage.taxesIncluded).toBeVisible();
        await expect(productPage.stockStatus(notebook.id)).toContainText(
            'In stock and ready to ship',
        );
        await expect(productPage.reviewsHeading).toBeVisible();
        await expect(productPage.verifiedPurchases).toBeVisible();

        // Add the notebook to the bag and check the order totals.
        await expect(productPage.addToBagButton).toBeEnabled();
        await productPage.addToBag();
        await expect(shoppingBagPage.heading).toBeVisible();

        const cartItem = shoppingBagPage.item(notebook.id);
        await expect(cartItem).toBeVisible();
        await expect(
            shoppingBagPage.productLink(notebook.id, notebook.name),
        ).toBeVisible();
        await expect(cartItem).toContainText(`${notebook.price} · In stock`);
        await expect(shoppingBagPage.quantity(notebook.id)).toHaveValue('1');
        await expect(shoppingBagPage.lineTotal(notebook.id)).toHaveText(notebook.price);
        await expect(shoppingBagPage.subtotal).toHaveText(notebook.price);
        await expect(
            shoppingBagPage.shippingAmount(orderTotals.shipping),
        ).toBeVisible();
        await expect(shoppingBagPage.total).toHaveText(orderTotals.total);
        await expect(shoppingBagPage.continueToCheckout).toBeEnabled();
        await expect(shoppingBagPage.continueShopping).toBeVisible();

        // Complete checkout with a randomly generated shipping address.
        await shoppingBagPage.proceedToCheckout();
        await expect(checkoutPage.deliveryHeading).toBeVisible();
        await expect(checkoutPage.paymentHeading).toBeVisible();
        await expect(checkoutPage.safeCheckoutNotice).toBeVisible();
        await expect(checkoutPage.simulatedPaymentNotice).toBeVisible();
        await expect(checkoutPage.summary).toContainText(notebook.name);
        await expect(checkoutPage.summary).toContainText('Qty 1');
        await expect(checkoutPage.summary).toContainText(notebook.price);
        await expect(checkoutPage.summary).toContainText(orderTotals.shipping);
        await expect(checkoutPage.summary).toContainText(orderTotals.total);

        const address = createRandomShippingAddress();
        await checkoutPage.fillShippingAddress(address);
        await expect(checkoutPage.streetField).toHaveValue(address.street);
        await expect(checkoutPage.cityField).toHaveValue(address.city);
        await expect(checkoutPage.regionField).toHaveValue(address.region);
        await expect(checkoutPage.postalCodeField).toHaveValue(address.postalCode);
        await expect(checkoutPage.countryField).toHaveValue(address.country);
        await checkoutPage.placeOrder();

        // Verify the completed order and its details.
        await expect(orderConfirmationPage.confirmation).toBeVisible();
        await expect(orderConfirmationPage.heading).toBeVisible();
        await expect(orderConfirmationPage.orderReceivedLabel).toBeVisible();
        await expect(orderConfirmationPage.simulatedPaymentNotice).toBeVisible();
        await expect(orderConfirmationPage.orderTotalLabel).toBeVisible();
        await expect(
            orderConfirmationPage.orderTotal(orderTotals.total),
        ).toBeVisible();
        await expect(orderConfirmationPage.orderNumber).toContainText(
            /DS-[A-F0-9]{8}/i,
        );
        await expect(orderConfirmationPage.viewOrderLink).toBeVisible();
        await expect(orderConfirmationPage.viewOrderLink).toBeEnabled();
        await expect(orderConfirmationPage.viewOrderLink).toHaveAttribute(
            'href',
            /^\/orders\/[0-9a-f-]+$/i,
        );
    });
});
