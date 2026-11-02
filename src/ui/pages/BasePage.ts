import type { Locator } from '@playwright/test';
import { BaseLocators } from '../locators/BaseLocators';
import { highlightElements } from '../helpers/highlight';

/** Common navigation and optional interaction highlighting for storefront page objects. */
export class BasePage extends BaseLocators {
    private highlightInteractions = false;

    protected async goto(path: string): Promise<void> {
        await this.page.goto(path);
    }

    /** Enables visible click/fill highlighting for headed portfolio demonstrations. */
    enableInteractionHighlighting(): this {
        this.highlightInteractions = true;
        return this;
    }

    protected async click(locator: Locator): Promise<void> {
        await this.highlight(locator);
        await locator.click();
    }

    protected async fill(locator: Locator, value: string): Promise<void> {
        await this.highlight(locator);
        await locator.fill(value);
    }

    private async highlight(locator: Locator): Promise<void> {
        if (!this.highlightInteractions) {
            return;
        }

        await locator.waitFor({ state: 'attached' });
        await highlightElements(locator);
    }
}
