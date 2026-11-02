import type { AuthApi } from '../clients/AuthApi';
import type { LoginResponse, LogoutResponse, RegisterRequest } from '../models/auth';
import { readJson } from './serviceResponse';

/**
 * Account sessions on top of AuthApi. Login counts toward the 20 per minute limit:
 * use the shared sessions from global setup unless the test is about login.
 */
export class AuthService {
  constructor(private readonly api: AuthApi) {}

  /** POST /api/v1/auth/register - 201, new customer and session. */
  async register(body: RegisterRequest): Promise<LoginResponse> {
    return readJson<LoginResponse>(await this.api.register(body), 201, 'Register');
  }

  /** POST /api/v1/auth/login - 200. */
  async login(email: string, password: string): Promise<LoginResponse> {
    return readJson<LoginResponse>(await this.api.login(email, password), 200, 'Login');
  }

  /** POST /api/v1/auth/refresh - 200, rotated session. The old refresh token stops working. */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    return readJson<LoginResponse>(await this.api.refresh({ refreshToken }), 200, 'Refresh session');
  }

  /** POST /api/v1/auth/logout - 200, revokes the refresh token. */
  async logout(refreshToken?: string): Promise<LogoutResponse> {
    const body = refreshToken === undefined ? {} : { refreshToken };
    return readJson<LogoutResponse>(await this.api.logout(body), 200, 'Logout');
  }
}
