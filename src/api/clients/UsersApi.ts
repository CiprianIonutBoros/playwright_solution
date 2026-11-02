import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import { bearerOptions } from './bearer';
import type { UpdateProfileRequest, UpdateUserRoleRequest } from '../models/user';

/** HTTP operations for the current user and admin-only user management. Assertions stay in tests. */
export class UsersApi extends BaseApiClient {
  /** GET /api/v1/me - 200, CurrentUser; a rejected token gives 401 UNAUTHENTICATED. */
  async me(accessToken: string): Promise<APIResponse> {
    return this.get('/api/v1/me', bearerOptions(accessToken));
  }

  /** GET /api/v1/admin/users - 200 for admins; a customer token gives 403 FORBIDDEN. */
  async listAll(accessToken: string, params?: RequestOptions['params']): Promise<APIResponse> {
    return this.get('/api/v1/admin/users', { ...bearerOptions(accessToken), params });
  }

  /** PATCH /api/v1/me - 200, updated account (schema unspecified). */
  async updateMe(body: UpdateProfileRequest, accessToken: string): Promise<APIResponse> {
    return this.patch('/api/v1/me', body, bearerOptions(accessToken));
  }

  /** PATCH /api/v1/admin/users/{id}/role - 200, assigned role (schema unspecified). */
  async updateRole(id: string, body: UpdateUserRoleRequest, accessToken: string): Promise<APIResponse> {
    return this.patch(`/api/v1/admin/users/${encodeURIComponent(id)}/role`, body, bearerOptions(accessToken));
  }
}
