import { expect as baseExpect, request as playwrightRequest, test as base } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { AuthApi } from '../api/clients/AuthApi';
import { ProductsApi } from '../api/clients/ProductsApi';
import { SystemApi } from '../api/clients/SystemApi';
import { InventoryApi } from '../api/clients/InventoryApi';
import { ReviewsApi } from '../api/clients/ReviewsApi';
import { LabApi } from '../api/clients/LabApi';
import { DashboardApi } from '../api/clients/DashboardApi';
import { ActivityApi } from '../api/clients/ActivityApi';
import { WebhooksApi } from '../api/clients/WebhooksApi';
import { GraphQLApi } from '../api/clients/GraphQLApi';
import { bearerOptions } from '../api/clients/bearer';
import { API_BASE_URL, loadSharedSessions } from '../shared/helpers/sharedSession';
import { expect } from './expect';
import { AccountPage } from '../ui/pages/AccountPage';
import { CatalogPage } from '../ui/pages/CatalogPage';
import { CheckoutPage } from '../ui/pages/CheckoutPage';
import { LoginPage } from '../ui/pages/LoginPage';
import { OrderConfirmationPage } from '../ui/pages/OrderConfirmationPage';
import { OrderDetailsPage } from '../ui/pages/OrderDetailsPage';
import { OrderHistoryPage } from '../ui/pages/OrderHistoryPage';
import { ProductPage } from '../ui/pages/ProductPage';
import { ShoppingBagPage } from '../ui/pages/ShoppingBagPage';

type AppFixtures = {
    apiRequest: APIRequestContext;
    authToken: string;
    authenticatedApiRequest: APIRequestContext;
    authApi: AuthApi;
    productsApi: ProductsApi;
    systemApi: SystemApi;
    inventoryApi: InventoryApi;
    reviewsApi: ReviewsApi;
    labApi: LabApi;
    dashboardApi: DashboardApi;
    activityApi: ActivityApi;
    webhooksApi: WebhooksApi;
    graphQLApi: GraphQLApi;
    loginPage: LoginPage;
    accountPage: AccountPage;
    catalogPage: CatalogPage;
    productPage: ProductPage;
    shoppingBagPage: ShoppingBagPage;
    checkoutPage: CheckoutPage;
    orderConfirmationPage: OrderConfirmationPage;
    orderHistoryPage: OrderHistoryPage;
    orderDetailsPage: OrderDetailsPage;
};

/** Shared API clients and page objects used by the API, UI, and combined projects. */
export const test = base.extend<AppFixtures>({
    apiRequest: async ({}, use) => {
        const context = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
        try {
            await use(context);
        } finally {
            await context.dispose();
        }
    },
    authToken: async ({}, use) => {
        await use(loadSharedSessions().adminAccessToken);
    },
    authenticatedApiRequest: async ({ authToken }, use) => {
        const context = await playwrightRequest.newContext({
            baseURL: API_BASE_URL,
            extraHTTPHeaders: bearerOptions(authToken).headers,
        });
        try {
            await use(context);
        } finally {
            await context.dispose();
        }
    },
    authApi: async ({ apiRequest }, use) => {
        await use(new AuthApi(apiRequest));
    },
    productsApi: async ({ apiRequest }, use) => {
        await use(new ProductsApi(apiRequest));
    },
    systemApi: async ({ apiRequest }, use) => {
        await use(new SystemApi(apiRequest));
    },
    inventoryApi: async ({ apiRequest }, use) => {
        await use(new InventoryApi(apiRequest));
    },
    reviewsApi: async ({ apiRequest }, use) => {
        await use(new ReviewsApi(apiRequest));
    },
    labApi: async ({ apiRequest }, use) => {
        await use(new LabApi(apiRequest));
    },
    dashboardApi: async ({ apiRequest }, use) => {
        await use(new DashboardApi(apiRequest));
    },
    activityApi: async ({ apiRequest }, use) => {
        await use(new ActivityApi(apiRequest));
    },
    webhooksApi: async ({ apiRequest }, use) => {
        await use(new WebhooksApi(apiRequest));
    },
    graphQLApi: async ({ apiRequest }, use) => {
        await use(new GraphQLApi(apiRequest));
    },
    page: async ({ page, browserName }, use) => {
        if (browserName === 'chromium') {
            const session = await page.context().newCDPSession(page);
            try {
                const { windowId } = await session.send('Browser.getWindowForTarget');
                await session.send('Browser.setWindowBounds', {
                    windowId,
                    bounds: { windowState: 'maximized' },
                });
                await baseExpect.poll(async () => {
                    const { bounds } = await session.send('Browser.getWindowBounds', { windowId });
                    return bounds.windowState;
                }).toBe('maximized');
            } finally {
                await session.detach();
            }
        }
        await use(page);
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page).enableInteractionHighlighting());
    },
    accountPage: async ({ page }, use) => {
        await use(new AccountPage(page).enableInteractionHighlighting());
    },
    catalogPage: async ({ page }, use) => {
        await use(new CatalogPage(page).enableInteractionHighlighting());
    },
    productPage: async ({ page }, use) => {
        await use(new ProductPage(page).enableInteractionHighlighting());
    },
    shoppingBagPage: async ({ page }, use) => {
        await use(new ShoppingBagPage(page).enableInteractionHighlighting());
    },
    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page).enableInteractionHighlighting());
    },
    orderConfirmationPage: async ({ page }, use) => {
        await use(new OrderConfirmationPage(page).enableInteractionHighlighting());
    },
    orderHistoryPage: async ({ page }, use) => {
        await use(new OrderHistoryPage(page).enableInteractionHighlighting());
    },
    orderDetailsPage: async ({ page }, use) => {
        await use(new OrderDetailsPage(page).enableInteractionHighlighting());
    },
});

export { expect };
