import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

/** HTTP-only base class. Returns the raw Playwright response; assertions stay in tests. */
export class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected get(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.get(path, this.withOptions(options));
  }

  protected post<T>(path: string, data?: T, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.post(path, {
      ...(data === undefined ? {} : { data }),
      ...this.withOptions(options),
    });
  }

  protected put<T>(path: string, data: T, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.put(path, { data, ...this.withOptions(options) });
  }

  protected patch<T>(path: string, data: T, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.patch(path, { data, ...this.withOptions(options) });
  }

  protected delete(path: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.request.delete(path, this.withOptions(options));
  }

  private withOptions(options: RequestOptions): RequestOptions {
    return {
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.params ? { params: options.params } : {}),
    };
  }
}
