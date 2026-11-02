import type { UsersApi } from '../clients/UsersApi';
import type { RequestOptions } from '../clients/BaseApiClient';
import type { CurrentUser, UpdateProfileRequest, UpdateUserRoleRequest, UserList } from '../models/user';
import { readJson } from './serviceResponse';

export class UserService {
  constructor(private readonly api: UsersApi) {}

  /** GET /api/v1/me - 200. */
  async me(accessToken: string): Promise<CurrentUser> {
    return readJson<CurrentUser>(await this.api.me(accessToken), 200, 'Read current user');
  }

  /** PATCH /api/v1/me - 200. */
  async updateMe(body: UpdateProfileRequest, accessToken: string): Promise<CurrentUser> {
    return readJson<CurrentUser>(await this.api.updateMe(body, accessToken), 200, 'Update current user');
  }

  /** GET /api/v1/admin/users - 200. Admin only; pass `{ limit, after }` to page. */
  async list(accessToken: string, params?: RequestOptions['params']): Promise<UserList> {
    return readJson<UserList>(await this.api.listAll(accessToken, params), 200, 'List users');
  }

  /** PATCH /api/v1/admin/users/{id}/role - 200. Admin only. */
  async assignRole(userId: string, role: UpdateUserRoleRequest['role'], accessToken: string): Promise<CurrentUser> {
    return readJson<CurrentUser>(await this.api.updateRole(userId, { role }, accessToken), 200, 'Assign role');
  }
}
