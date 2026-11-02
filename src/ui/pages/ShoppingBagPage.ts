import { ShoppingBagLocators } from '../locators/ShoppingBagLocators';

export class ShoppingBagPage extends ShoppingBagLocators {
    async open(): Promise<void> {
        await this.goto('/cart');
    }

    async setQuantity(productId: string, quantity: number): Promise<void> {
        await this.quantity(productId).selectOption(String(quantity));
    }

    async removeItem(productId: string): Promise<void> {
        await this.click(this.removeButton(productId));
    }

    async proceedToCheckout(): Promise<void> {
        await this.click(this.continueToCheckout);
    }
}
