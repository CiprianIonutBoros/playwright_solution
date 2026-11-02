import { request as playwrightRequest } from '@playwright/test';
import { AuthApi } from '../api/clients/AuthApi';
import { validAdminUser, validUser } from '../shared/data/users';
import { getAccessToken } from '../api/helpers/authRequests';
import { loginForSession } from '../api/helpers/sessionRequests';
import { API_BASE_URL, saveSharedSessions } from '../shared/helpers/sharedSession';

/**
 * Runs once before the suite. Each user signs in exactly once, and every worker and test
 * reads the saved sessions. This keeps DemoShop's login rate limit (20 per minute) from being exhausted.
 */
export default async function globalSetup(): Promise<void> {
  const request = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  try {
    const authApi = new AuthApi(request);
    const customer = await loginForSession(authApi, validUser.email, validUser.password);
    const adminAccessToken = await getAccessToken(authApi, validAdminUser.email, validAdminUser.password);
    saveSharedSessions({ customer, adminAccessToken });
  } finally {
    await request.dispose();
  }
}
