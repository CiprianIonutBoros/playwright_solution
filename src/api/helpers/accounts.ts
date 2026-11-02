import type { APIResponse } from '@playwright/test';
import type { AuthApi } from '../clients/AuthApi';
import type { LoginResponse, RegisterRequest } from '../models/auth';
import type { CurrentUser } from '../models/user';
import { expect } from '../../fixtures/expect';
import { newAccount } from '../../shared/data/users';
import { isIsoTimestamp, opaqueTokenPattern, uuidPattern } from '../../shared/data/formats';

/** Registration returns the full profile of the new user, not only id and email. */
export type RegisteredSession = LoginResponse & { user: CurrentUser };

/** Decodes the claims of a JWT access token without verifying its signature. */
export function decodeAccessToken(accessToken: string): Record<string, unknown> {
  const [, payload] = accessToken.split('.');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

/**
 * Checks a customer session exactly: the access token is a JWT for this user that lives 900 seconds,
 * and the refresh token is 64 hex characters.
 */
export function expectSession(session: LoginResponse, email: string): void {
  expect(session.user.id).toMatch(uuidPattern);
  expect(session.user.email).toBe(email);
  expect(session.expiresIn).toBe(900);
  expect(session.refreshToken).toMatch(opaqueTokenPattern);
  const claims = decodeAccessToken(session.accessToken);
  expect(claims).toMatchObject({ sub: session.user.id, email, role: 'customer' });
  expect(Number(claims.exp) - Number(claims.iat)).toBe(900);
}

/**
 * Sends a rate-limited request again while it returns 429, then returns the first other response.
 * DemoShop checks the rate limit before validation, so invalid bodies need this too.
 */
export async function retryWhileThrottled(send: () => Promise<APIResponse>): Promise<APIResponse> {
  let response: APIResponse | undefined;
  // Other resource suites share the budget. Retry only throttling, not API failures.
  await expect.poll(async () => {
    response = await send();
    return response.status();
  }, { timeout: 90_000, message: 'Wait for the shared rate-limit budget' }).not.toBe(429);
  if (!response) {
    throw new Error('Rate-limit polling completed without a response.');
  }
  return response;
}

export async function registerWithRetry(authApi: AuthApi, account: RegisterRequest): Promise<APIResponse> {
  return retryWhileThrottled(() => authApi.register(account));
}

export async function registerAccount(authApi: AuthApi): Promise<{ account: RegisterRequest; session: RegisteredSession }> {
  const account = newAccount();
  const response = await registerWithRetry(authApi, account);
  expect(response.status()).toBe(201);
  const session: RegisteredSession = await response.json();
  expectSession(session, account.email);
  expect(session.user).toEqual({
    id: session.user.id,
    email: account.email,
    fullName: account.fullName,
    role: 'customer',
    address: account.address,
    createdAt: session.user.createdAt,
  });
  expect(isIsoTimestamp(session.user.createdAt)).toBe(true);
  return { account, session };
}

/** Checks the error envelope exactly. The body's requestId must be the one in the x-request-id header. */
export async function expectError(response: APIResponse, status: number, code: string): Promise<void> {
  expect(response.status()).toBe(status);
  const requestId = response.headers()['x-request-id'];
  expect(requestId).toMatch(uuidPattern);
  expect(await response.json()).toMatchObject({ error: { code }, requestId });
}
