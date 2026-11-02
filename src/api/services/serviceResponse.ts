import type { APIResponse } from '@playwright/test';
import type { ApiErrorResponse } from '../models/common';

/** Thrown by services when the API does not return the expected status. */
export class ApiStatusError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number,
    readonly expectedStatus: number,
    readonly body: string,
  ) {
    super(`${operation} returned ${status}, expected ${expectedStatus}${describeBody(body)}`);
    this.name = 'ApiStatusError';
  }

  /** The DemoShop `error.code`, when the body is an error envelope. */
  get code(): string | undefined {
    try {
      return (JSON.parse(this.body) as Partial<ApiErrorResponse>).error?.code;
    } catch {
      return undefined;
    }
  }
}

function describeBody(body: string): string {
  try {
    const code = (JSON.parse(body) as Partial<ApiErrorResponse>).error?.code;
    if (code) {
      return ` (${code})`;
    }
  } catch {
    // Not JSON: fall through to the raw text.
  }
  return body ? `: ${body.slice(0, 200)}` : '';
}

async function requireStatus(response: APIResponse, expectedStatus: number, operation: string): Promise<void> {
  if (response.status() !== expectedStatus) {
    throw new ApiStatusError(operation, response.status(), expectedStatus, await response.text());
  }
}

/** Checks the status and JSON content type, then returns the parsed body. */
export async function readJson<T>(response: APIResponse, expectedStatus: number, operation: string): Promise<T> {
  await requireStatus(response, expectedStatus, operation);
  const contentType = response.headers()['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${operation} returned content type "${contentType}", expected application/json`);
  }
  return (await response.json()) as T;
}

/** Checks the status and that the response has no body (for example 204). */
export async function readEmpty(response: APIResponse, expectedStatus: number, operation: string): Promise<void> {
  await requireStatus(response, expectedStatus, operation);
  const body = await response.body();
  if (body.length > 0) {
    throw new Error(`${operation} returned a ${body.length}-byte body, expected none`);
  }
}
