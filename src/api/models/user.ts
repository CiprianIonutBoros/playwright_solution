export interface UpdateProfileRequest {
  fullName?: string;
  address?: Record<string, string>;
}

export interface UpdateUserRoleRequest {
  role: 'customer' | 'support_agent' | 'inventory_manager' | 'store_admin';
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  address?: Record<string, string>;
}

export interface UserList {
  items: CurrentUser[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}
