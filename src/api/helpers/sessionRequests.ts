import type { AuthApi } from '../clients/AuthApi';
import type { LoginResponse } from '../models/auth';

/** Signs in through the API and returns the full session (user and tokens). */
export async function loginForSession(
  authApi: AuthApi,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await authApi.login(email, password);
  if (!response.ok()) {
    throw new Error(`Login failed with status ${response.status()}`);
  }
  return (await response.json()) as LoginResponse;
}
