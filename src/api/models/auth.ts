export interface RegisterRequest {
  email: string;
  /** 8 to 128 characters. */
  password: string;
  fullName: string;
  address?: Record<string, string>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LoginResponse {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  loggedOut: boolean;
}
