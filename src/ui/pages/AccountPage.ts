import { AccountLocators } from '../locators/AccountLocators';

export class AccountPage extends AccountLocators {
    async open(): Promise<void> {
        await this.goto('/account');
    }
}
