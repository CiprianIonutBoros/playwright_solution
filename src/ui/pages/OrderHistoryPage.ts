import { OrderHistoryLocators } from '../locators/OrderHistoryLocators';

export class OrderHistoryPage extends OrderHistoryLocators {
    async open(): Promise<void> {
        await this.goto('/orders');
    }

    async openFromNavigation(): Promise<void> {
        await this.click(this.ordersNavigationLink);
    }

    async openOrderDetails(orderNumber: string): Promise<void> {
        await this.click(this.detailsLink(orderNumber));
    }

    async openRandomOrderDetails() {
        await this.table.waitFor({ state: 'visible' });
        const orderCount = await this.detailsLinks.count();

        if (orderCount === 0) {
            throw new Error('Cannot open random order details: no orders are available.');
        }

        const randomIndex = Math.floor(Math.random() * orderCount);
        const cells = this.orderCellsAt(randomIndex);
        const detailsPath = await this.detailsLinks.nth(randomIndex).getAttribute('href');
        if (!detailsPath) {
            throw new Error('Cannot open random order details: the details link has no href.');
        }

        const order = {
            number: (await cells.nth(0).innerText()).trim(),
            placedDate: (await cells.nth(1).innerText()).trim(),
            status: (await cells.nth(2).innerText()).trim(),
            total: (await cells.nth(3).innerText()).trim(),
            detailsPath,
        };

        await this.click(this.detailsLinks.nth(randomIndex));
        return order;
    }
}
