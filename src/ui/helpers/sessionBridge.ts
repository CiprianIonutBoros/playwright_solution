import type { Page } from '@playwright/test';
import type { LoginResponse } from '../../api/models/auth';

/** localStorage keys used by the DemoShop UI. */
export const SESSION_STORAGE_KEY = 'demoshop.session';
export const CART_STORAGE_KEY = 'demoshop.cart-id';

interface SignInOptions {
  cartId?: string;
  path?: string;
}

/**
 * Writes a session issued by the API into the browser's localStorage, then opens the page.
 * The UI starts signed in without typing credentials, so the browser test continues where the API step ended.
 */
export async function signInWithSession(
  page: Page,
  session: LoginResponse,
  options: SignInOptions = {},
): Promise<void> {
  // The app must be loaded once on its origin before localStorage can be written.
  await page.goto('/account');
  await page.evaluate(
    ({ sessionKey, cartKey, sessionJson, cartId }) => {
      localStorage.setItem(sessionKey, sessionJson);
      if (cartId) {
        localStorage.setItem(cartKey, cartId);
      }
    },
    {
      sessionKey: SESSION_STORAGE_KEY,
      cartKey: CART_STORAGE_KEY,
      sessionJson: JSON.stringify(session),
      cartId: options.cartId,
    },
  );
  await page.goto(options.path ?? '/account');
}

/** Reads the session the UI stored after a real sign-in in the browser. */
export async function readStoredSession(page: Page): Promise<LoginResponse> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SESSION_STORAGE_KEY);
  if (!raw) {
    throw new Error(`No session found under ${SESSION_STORAGE_KEY}`);
  }
  return JSON.parse(raw) as LoginResponse;
}

/** Reads the cart id the UI stored for the current browser. */
export async function readStoredCartId(page: Page): Promise<string> {
  const cartId = await page.evaluate(key => localStorage.getItem(key), CART_STORAGE_KEY);
  if (!cartId) {
    throw new Error(`No cart id found under ${CART_STORAGE_KEY}`);
  }
  return cartId;
}
