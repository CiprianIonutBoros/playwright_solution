import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class LoginLocators extends BasePage {
    protected readonly emailField: Locator;
    protected readonly passwordField: Locator;
    protected readonly submitButton: Locator;
    readonly errorMessage: Locator;
    readonly signedInHeading: Locator;

    constructor(page: Page) {
        super(page);
        this.emailField = page.getByTestId('login-email');
        this.passwordField = page.getByTestId('login-password');
        this.submitButton = page.getByTestId('login-submit');
        this.errorMessage = this.alert;
        this.signedInHeading = page.getByRole('heading', { name: 'The things you chose.',});
    }

}
