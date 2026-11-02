import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class ProductLocators extends BasePage {
    readonly addToBagButton: Locator;
    readonly reviewsHeading: Locator;
    readonly taxesIncluded: Locator;
    readonly verifiedPurchases: Locator;
    readonly notFoundMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.addToBagButton = page.getByRole('button', { name: 'Add to bag' });
        this.reviewsHeading = page.getByRole('heading', { name: 'From the community' });
        this.taxesIncluded = page.getByText('Taxes included');
        this.verifiedPurchases = page.getByText('0 verified purchases');
        this.notFoundMessage = page.getByText('Product not found.', { exact: true });
    }

    productHeading(productName: string): Locator {
        return this.page.getByRole('heading', { name: productName });
    }

    sku(sku: string): Locator {
        return this.page.getByText(sku);
    }

    category(category: string): Locator {
        return this.page.getByText(category, { exact: true });
    }

    description(description: string): Locator {
        return this.page.getByText(description);
    }

    price(price: string): Locator {
        return this.page.getByText(price, { exact: true });
    }

    stockStatus(productId: string): Locator {
        return this.page.getByTestId(`product-stock-${productId}`);
    }

}
