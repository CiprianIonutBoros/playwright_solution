import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class OrderDetailsLocators extends BasePage {
    readonly main: Locator;
    readonly backToOrdersLink: Locator;
    readonly heading: Locator;
    readonly orderNumber: Locator;
    readonly placedDate: Locator;
    readonly status: Locator;
    readonly itemsHeading: Locator;
    readonly items: Locator;
    readonly deliveryHeading: Locator;
    readonly deliveryAddress: Locator;
    readonly paymentSummary: Locator;
    readonly paymentSummaryLabel: Locator;
    readonly subtotal: Locator;
    readonly shipping: Locator;
    readonly total: Locator;
    readonly orderNote: Locator;
    readonly cancelOrderButton: Locator;

    constructor(page: Page) {
        super(page);
        this.main = page.getByRole('main');
        this.backToOrdersLink = this.main.getByRole('link', {
            name: 'Back to orders',
            exact: true,
        });
        this.heading = this.main.getByRole('heading', {
            name: /Thanks, we.ve got it\./,
            level: 1,
        });
        const orderHeader = this.main.locator('.order-detail-header');
        this.orderNumber = orderHeader.locator('.eyebrow');
        this.placedDate = orderHeader.getByText(/^Placed /);
        this.status = orderHeader.getByTestId(/^order-status-/);
        this.itemsHeading = this.main.getByRole('heading', { name: 'Items', exact: true });
        this.items = this.main.locator('.checkout-item');
        this.deliveryHeading = this.main.getByRole('heading', {
            name: 'Delivery address',
            exact: true,
        });
        this.deliveryAddress = this.main.locator('address');
        this.paymentSummary = this.main.locator('aside.order-summary');
        this.paymentSummaryLabel = this.paymentSummary.getByText('PAYMENT SUMMARY', {
            exact: true,
        });
        this.subtotal = this.paymentSummary.locator('.summary-row').filter({
            has: page.getByText('Subtotal', { exact: true }),
        }).locator('span').last();
        this.shipping = this.paymentSummary.locator('.summary-row').filter({
            has: page.getByText('Shipping', { exact: true }),
        }).locator('span').last();
        this.total = this.paymentSummary.locator('.summary-total strong').last();
        this.orderNote = this.paymentSummary.getByText(
            'Your payment and fulfilment status update as the order moves through the store.',
            { exact: true },
        );
        this.cancelOrderButton = this.paymentSummary.getByRole('button', {
            name: 'Cancel this order',
            exact: true,
        });
    }

    item(productName: string): Locator {
        return this.items.filter({
            has: this.page.getByText(productName, { exact: true }),
        });
    }

    itemName(productName: string): Locator {
        return this.item(productName).locator('strong');
    }

    itemQuantity(productName: string): Locator {
        return this.item(productName).getByText(/^Qty \d+$/);
    }

    itemTotal(productName: string): Locator {
        return this.item(productName).locator('b');
    }

    itemNameAt(index: number): Locator {
        return this.items.nth(index).locator('strong');
    }

    itemQuantityAt(index: number): Locator {
        return this.items.nth(index).getByText(/^Qty \d+$/);
    }

    itemTotalAt(index: number): Locator {
        return this.items.nth(index).locator('b');
    }

}
