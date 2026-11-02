import { OrderDetailsLocators } from '../locators/OrderDetailsLocators';

export class OrderDetailsPage extends OrderDetailsLocators {
    async open(orderId: string): Promise<void> {
        await this.goto(`/orders/${encodeURIComponent(orderId)}`);
    }

    async backToOrders(): Promise<void> {
        await this.click(this.backToOrdersLink);
    }

    async cancelOrder(): Promise<void> {
        await this.click(this.cancelOrderButton);
    }

    /**
     * Clicks "Cancel this order" and answers the browser's confirm prompt.
     * Returns the prompt text so the test can check which order it named.
     */
    async cancelOrderAndAnswer(answer: 'accept' | 'dismiss'): Promise<string> {
        const prompt = this.page.waitForEvent('dialog');
        const click = this.cancelOrder();
        const dialog = await prompt;
        const message = `${dialog.type()}: ${dialog.message()}`;
        await dialog[answer]();
        await click;
        return message;
    }
}
