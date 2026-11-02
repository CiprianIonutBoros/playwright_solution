import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class AccountLocators extends BasePage {
    readonly heading: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.getByRole('heading', { name: /Good to see you,/ });
    }

    email(email: string): Locator {
        return this.page.getByText(email);
    }

}
