import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class ShoppingBagLocators extends BasePage {
    readonly heading: Locator;
    /** "N piece(s) set aside for you": the number of distinct lines in the bag. */
    readonly lineCount: Locator;
    readonly items: Locator;
    readonly emptyMessage: Locator;
    readonly subtotal: Locator;
    readonly total: Locator;
    readonly continueToCheckout: Locator;
    readonly continueShopping: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Shopping bag' });
        this.lineCount = page.getByText(/^\d+ pieces? set aside for you$/);
        this.items = page.getByTestId(/^cart-item-/);
        this.emptyMessage = page.getByText(
            'There’s nothing here just yet. Find a useful little something in the collection.',
            { exact: true },
        );
        this.subtotal = page.getByTestId('cart-subtotal');
        this.total = page.getByTestId('cart-total');
        this.continueToCheckout = page.getByRole('link', { name: 'Continue to checkout' });
        this.continueShopping = page.getByRole('link', { name: 'Continue shopping' });
    }

    item(productId: string): Locator {
        return this.page.getByTestId(`cart-item-${productId}`);
    }

    quantity(productId: string): Locator {
        return this.page.getByTestId(`cart-quantity-${productId}`);
    }

    /** "$25.00 · In stock": unit price and stock status of one line. */
    unitPrice(productId: string): Locator {
        return this.item(productId).getByText(/ · /);
    }

    removeButton(productId: string): Locator {
        return this.page.getByTestId(`cart-remove-${productId}`);
    }

    lineTotal(productId: string): Locator {
        return this.page.getByTestId(`cart-line-total-${productId}`);
    }

    productLink(productId: string, productName: string): Locator {
        return this.item(productId).getByRole('link', { name: productName });
    }

    shippingAmount(amount: string): Locator {
        return this.page.getByText(amount, { exact: true });
    }

}
