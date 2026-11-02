import { LoginLocators } from '../locators/LoginLocators';

export class LoginPage extends LoginLocators {
    async open(): Promise<void> {
        await this.goto('/account');
    }

    async openFromNavigation(): Promise<void> {
        await this.click(this.accountNavigationLink);
    }

    async login(email: string, password: string): Promise<void> {
        await this.fill(this.emailField, email);
        await this.fill(this.passwordField, password);
        await this.click(this.submitButton);
    }
}
