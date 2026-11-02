import { ProductLocators } from '../locators/ProductLocators';

export class ProductPage extends ProductLocators {
    async open(productId: string): Promise<void> {
        await this.goto(`/products/${encodeURIComponent(productId)}`);
    }

    /** Adds the product to the bag, then opens the bag from the header. */
    async addToBag(): Promise<void> {
        await this.click(this.addToBagButton);
        await this.click(this.cartNavigationLink);
    }
}
