import type { RequestOptions } from './BaseApiClient';

/** Builds the Authorization header used by customer and admin endpoints. */
export function bearerOptions(accessToken: string): RequestOptions {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}
