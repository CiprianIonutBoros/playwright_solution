import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class CatalogLocators extends BasePage {
    readonly searchInput: Locator;
    readonly sortSelect: Locator;
    readonly categoryFilters: Locator;
    readonly results: Locator;

    constructor(page: Page) {
        super(page);
        this.searchInput = page.getByTestId('product-search-input');
        this.sortSelect = page.getByTestId('product-sort-select');
        this.categoryFilters = page.getByRole('group', { name: 'Filter by category' });
        this.results = page.getByTestId('catalog-results');
    }

    productCard(productId: string): Locator {
        return this.page.getByTestId(`product-card-${productId}`);
    }

    productTitle(productId: string): Locator {
        return this.page.getByTestId(`product-title-${productId}`);
    }
}
