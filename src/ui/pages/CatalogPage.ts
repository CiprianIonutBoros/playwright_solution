import { CatalogLocators } from '../locators/CatalogLocators';

export class CatalogPage extends CatalogLocators {
    async open(): Promise<void> {
        await this.click(this.catalogNavigationLink);
    }

    async search(query: string): Promise<void> {
        await this.fill(this.searchInput, query);
    }

    async openProduct(productId: string): Promise<void> {
        await this.click(this.productTitle(productId));
    }
}
