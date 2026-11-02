import { CheckoutLocators } from '../locators/CheckoutLocators';
import type { ShippingAddress } from '../../shared/data/shippingAddress';

export class CheckoutPage extends CheckoutLocators {
    async fillShippingAddress(address: ShippingAddress): Promise<void> {
        await this.fill(this.streetField, address.street);
        await this.fill(this.cityField, address.city);
        await this.fill(this.regionField, address.region);
        await this.fill(this.postalCodeField, address.postalCode);
        await this.fill(this.countryField, address.country);
    }

    async placeOrder(): Promise<void> {
        await this.click(this.placeOrderButton);
    }
}
