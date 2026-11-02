import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class OrderConfirmationLocators extends BasePage {
    readonly confirmation: Locator;
    readonly heading: Locator;
    readonly orderNumber: Locator;
    readonly viewOrderLink: Locator;
    readonly orderReceivedLabel: Locator;
    readonly simulatedPaymentNotice: Locator;
    readonly orderTotalLabel: Locator;

    constructor(page: Page) {
        super(page);
        this.confirmation = page.getByTestId('order-confirmation');
        this.heading = this.confirmation.getByRole('heading', {
            name: "That's a good choice.",
        });
        this.orderNumber = this.confirmation.locator('p').filter({ hasText: 'Your order' });
        this.viewOrderLink = this.confirmation.getByRole('link', { name: 'View your order' });
        this.orderReceivedLabel = this.confirmation.getByText('ORDER RECEIVED');
        this.simulatedPaymentNotice = this.confirmation.getByText(
            'This store uses a simulated payment step.',
            {
                exact: false,
            },
        );
        this.orderTotalLabel = this.confirmation.getByText('Order total');
    }

    orderTotal(amount: string): Locator {
        return this.confirmation.getByText(amount, { exact: true });
    }

}
