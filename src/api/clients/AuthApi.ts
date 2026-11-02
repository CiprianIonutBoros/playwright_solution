import type { APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import type { LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest } from '../models/auth';

/** HTTP operations for customer sign-in. Assertions stay in tests. */
export class AuthApi extends BaseApiClient {
  /** POST /api/v1/auth/login - 200, LoginResponse with user and tokens. */
  async login(email: string, password: string): Promise<APIResponse> {
    const body: LoginRequest = { email, password };
    return this.post('/api/v1/auth/login', body);
  }

  /** POST /api/v1/auth/register - 201, account and session (schema unspecified). */
  async register(body: RegisterRequest): Promise<APIResponse> {
    return this.post('/api/v1/auth/register', body);
  }

  /** POST /api/v1/auth/refresh - 200, rotated session (schema unspecified). */
  async refresh(body: RefreshRequest): Promise<APIResponse> {
    return this.post('/api/v1/auth/refresh', body);
  }

  /** POST /api/v1/auth/logout - 200, revocation result (schema unspecified). */
  async logout(body: LogoutRequest = {}): Promise<APIResponse> {
    return this.post('/api/v1/auth/logout', body);
  }
}
