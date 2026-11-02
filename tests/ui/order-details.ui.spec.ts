import { expect, test } from '../../src/fixtures/test';
import { validUser } from '../../src/shared/data/users';

test('random order details match history and contain valid totals and delivery address', async ({
    page,
    loginPage,
    orderHistoryPage,
    orderDetailsPage,
}) => {
    // Sign in and capture the selected order's history values before navigation.
    await loginPage.open();
    await loginPage.login(validUser.email, validUser.password);
    await expect(loginPage.signedInHeading).toBeVisible();
    await orderHistoryPage.openFromNavigation();
    await expect(orderHistoryPage.table).toBeVisible();
    const order = await orderHistoryPage.openRandomOrderDetails();

    // Compare the details with the same order in history, not hardcoded sample data.
    expect(order.number).toMatch(/^DS-[A-F0-9]{8}$/i);
    expect(order.detailsPath).toMatch(/^\/orders\/[0-9a-f-]+$/i);
    await expect(page).toHaveURL(new URL(order.detailsPath, page.url()).href);
    await expect(orderDetailsPage.heading).toBeVisible();
    await expect(orderDetailsPage.orderNumber).toHaveText(`ORDER ${order.number}`);
    await expect(orderDetailsPage.status).toHaveText(order.status, { ignoreCase: true });
    await expect(orderDetailsPage.total).toHaveText(order.total);

    await expect(orderDetailsPage.placedDate).toHaveText(
        /^Placed [A-Za-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M$/,
    );
    const placedText = await orderDetailsPage.placedDate.innerText();
    const placedDate = new Date(placedText.replace(/^Placed /, '').split(' at ')[0]);
    expect(Number.isNaN(placedDate.getTime())).toBe(false);
    expect(placedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })).toBe(order.placedDate);

    // Sum line totals in cents to avoid floating-point rounding errors.
    await expect(orderDetailsPage.itemsHeading).toBeVisible();
    await expect(orderDetailsPage.items.first()).toBeVisible();
    const itemCount = await orderDetailsPage.items.count();
    expect(itemCount).toBeGreaterThan(0);
    let itemsTotalInCents = 0;

    for (let index = 0; index < itemCount; index++) {
        await expect(orderDetailsPage.itemNameAt(index)).toHaveText(/\S+/);
        await expect(orderDetailsPage.itemQuantityAt(index)).toHaveText(/^Qty [1-9]\d*$/);
        await expect(orderDetailsPage.itemTotalAt(index)).toHaveText(/^\$\d+\.\d{2}$/);

        const lineTotal = await orderDetailsPage.itemTotalAt(index).innerText();
        const lineTotalInCents = Math.round(Number(lineTotal.replace('$', '')) * 100);
        expect(lineTotalInCents).toBeGreaterThan(0);
        itemsTotalInCents += lineTotalInCents;
    }

    await expect(orderDetailsPage.paymentSummaryLabel).toBeVisible();
    await expect(orderDetailsPage.subtotal).toHaveText(/^\$\d+\.\d{2}$/);
    await expect(orderDetailsPage.shipping).toHaveText(/^\$\d+\.\d{2}$/);
    await expect(orderDetailsPage.total).toHaveText(/^\$\d+\.\d{2}$/);
    const subtotal = await orderDetailsPage.subtotal.innerText();
    const shipping = await orderDetailsPage.shipping.innerText();
    const total = await orderDetailsPage.total.innerText();
    const subtotalInCents = Math.round(Number(subtotal.replace('$', '')) * 100);
    const shippingInCents = Math.round(Number(shipping.replace('$', '')) * 100);
    const totalInCents = Math.round(Number(total.replace('$', '')) * 100);
    expect(subtotalInCents).toBe(itemsTotalInCents);
    expect(shippingInCents).toBeGreaterThanOrEqual(0);
    expect(totalInCents).toBe(subtotalInCents + shippingInCents);

    // Existing random orders have no known expected address; validate its structure.
    await expect(orderDetailsPage.deliveryHeading).toBeVisible();
    await expect(orderDetailsPage.deliveryAddress).toBeVisible();
    const addressText = await orderDetailsPage.deliveryAddress.innerText();
    const addressLines = addressText.split('\n').map(line => line.trim());
    expect(addressLines).toHaveLength(3);
    expect(addressLines[0]).toMatch(/^\d+\s+\S.+$/);
    expect(addressLines[1]).toMatch(/\S+/);
    expect(addressLines[2]).toMatch(/^[A-Z]{2}$/);
    if (addressLines[2] === 'US') {
        expect(addressLines[1]).toMatch(/^.+ [A-Z]{2} \d{5}(?:-\d{4})?$/);
    }

    await expect(orderDetailsPage.orderNote).toBeVisible();
    await expect(orderDetailsPage.backToOrdersLink).toBeVisible();
    await orderDetailsPage.backToOrders();
    await expect(orderHistoryPage.orderRow(order.number)).toBeVisible();
});
