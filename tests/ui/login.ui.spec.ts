import { test, expect } from '../../src/fixtures/test';
import { validUser } from '../../src/shared/data/users';

test('valid credentials open the customer account', async ({ page, loginPage, accountPage }) => {
    await loginPage.open();
    await loginPage.login(validUser.email, validUser.password);
    await expect(page.getByRole('link', { name: /Account for Ava Customer/ })).toBeVisible();
    await accountPage.open();
    await expect(accountPage.heading).toBeVisible();
});

test('wrong password shows the service error', async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(validUser.email, 'WrongPassword123!');
    await expect(loginPage.errorMessage).toHaveText('Email or password was not recognized.');
});
