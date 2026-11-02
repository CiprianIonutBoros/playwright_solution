import type { AuthApi } from '../clients/AuthApi';

export async function getAccessToken(
  authApi: AuthApi,
  email: string,
  password: string,
): Promise<string> {
  const response = await authApi.login(email, password);
  if (!response.ok()) {
    throw new Error(`Login failed with status ${response.status()}`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object'
    || payload === null
    || !('accessToken' in payload)
    || typeof payload.accessToken !== 'string'
    || payload.accessToken.length === 0
  ) {
    throw new Error('Login response did not contain a valid accessToken');
  }

  return payload.accessToken;
}
