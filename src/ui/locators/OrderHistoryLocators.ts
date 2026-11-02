import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class OrderHistoryLocators extends BasePage {
    readonly main: Locator;
    readonly heading: Locator;
    readonly description: Locator;
    readonly ordersNavigationLink: Locator;
    readonly table: Locator;
    readonly rows: Locator;
    readonly detailsLinks: Locator;

    constructor(page: Page) {
        super(page);
        this.main = page.getByRole('main');
        this.heading = this.main.getByRole('heading', {
            name: 'The things you chose.',
            exact: true,
        });
        this.description = this.main.getByText(
            'Every order, with its own story to tell.',
            { exact: true },
        );
        this.ordersNavigationLink = this.primaryNav.getByRole('link', {
            name: 'Orders',
            exact: true,
        });
        this.table = this.main.getByRole('table');
        this.rows = this.table.locator('tbody').getByRole('row');
        this.detailsLinks = this.rows.getByRole('link', { name: 'Details', exact: true });
    }

    orderRow(orderNumber: string): Locator {
        return this.rows.filter({
            has: this.page.getByRole('cell', { name: orderNumber, exact: true }),
        });
    }

    orderNumber(orderNumber: string): Locator {
        return this.orderRow(orderNumber).getByRole('cell').nth(0);
    }

    placedDate(orderNumber: string): Locator {
        return this.orderRow(orderNumber).getByRole('cell').nth(1);
    }

    status(orderNumber: string): Locator {
        return this.orderRow(orderNumber).getByRole('cell').nth(2);
    }

    total(orderNumber: string): Locator {
        return this.orderRow(orderNumber).getByRole('cell').nth(3);
    }

    detailsLink(orderNumber: string): Locator {
        return this.orderRow(orderNumber).getByRole('link', { name: 'Details', exact: true });
    }

    protected orderCellsAt(index: number): Locator {
        return this.rows.nth(index).getByRole('cell');
    }
}
