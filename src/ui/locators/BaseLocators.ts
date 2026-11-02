import type { Locator, Page } from '@playwright/test';

export class BaseLocators {
    readonly header: Locator;
    readonly primaryNav: Locator;
    /** Total units in the bag, shown on the header bag link. */
    readonly bagCount: Locator;
    readonly accountLink: Locator;
    readonly alert: Locator;
    protected readonly accountNavigationLink: Locator;
    protected readonly catalogNavigationLink: Locator;
    protected readonly cartNavigationLink: Locator;

    constructor(protected readonly page: Page) {
        this.header = page.getByRole('banner');
        this.primaryNav = this.header.getByRole('navigation', { name: 'Primary navigation' });
        this.bagCount = this.header.getByTestId('cart-count');
        this.accountLink = this.header.getByRole('link', { name: /Sign in|Account/ });
        this.alert = page.getByRole('alert');
        this.accountNavigationLink = page.getByTestId('nav-account');
        this.catalogNavigationLink = page.getByTestId('nav-catalog');
        this.cartNavigationLink = page.getByTestId('nav-cart');
    }
}
