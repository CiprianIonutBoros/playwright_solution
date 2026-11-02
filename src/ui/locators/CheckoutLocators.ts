import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class CheckoutLocators extends BasePage {
    readonly form: Locator;
    readonly deliveryHeading: Locator;
    readonly paymentHeading: Locator;
    readonly safeCheckoutNotice: Locator;
    readonly simulatedPaymentNotice: Locator;
    readonly summary: Locator;
    readonly placeOrderButton: Locator;
    readonly streetField: Locator;
    readonly cityField: Locator;
    readonly regionField: Locator;
    readonly postalCodeField: Locator;
    readonly countryField: Locator;

    constructor(page: Page) {
        super(page);
        this.form = page.getByTestId('checkout-form');
        this.deliveryHeading = this.form.getByRole('heading', {
            name: 'Delivery address',
        });
        this.paymentHeading = this.form.getByRole('heading', {
            name: 'Payment',
        });
        this.safeCheckoutNotice = page.getByText('Safe demo checkout');
        this.simulatedPaymentNotice = page.getByText(
            'Payment is simulated. Never enter real card details.',
        );
        this.summary = page.locator('aside.checkout-summary');
        this.placeOrderButton = page.getByRole('button', { name: 'Place order' });
        this.streetField = page.getByTestId('shipping-address');
        this.cityField = page.getByLabel('City');
        this.regionField = page.getByLabel('State / region');
        this.postalCodeField = page.getByLabel('Postal code');
        this.countryField = page.getByLabel('Country');
    }

}
