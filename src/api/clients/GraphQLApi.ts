import type { APIResponse } from '@playwright/test';
import { BaseApiClient, type RequestOptions } from './BaseApiClient';
import type { GraphQLQueryParameters, GraphQLRequest } from '../models/graphql';

export class GraphQLApi extends BaseApiClient {
  /** GET /graphql - 2XX, GraphQLResponse. */
  async query(parameters: GraphQLQueryParameters = {}, options: RequestOptions = {}): Promise<APIResponse> {
    const params: NonNullable<RequestOptions['params']> = { ...options.params };
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined) {
        params[key] = value === null ? 'null' : value;
      }
    }
    return this.get('/graphql', { ...options, params });
  }

  /** POST /graphql - 2XX, GraphQLResponse. */
  async execute(body: GraphQLRequest, options: RequestOptions = {}): Promise<APIResponse> {
    return this.post('/graphql', body, options);
  }

  /** GET /graphiql - 200, editor document (schema unspecified). */
  async editor(): Promise<APIResponse> {
    return this.get('/graphiql');
  }

  /** GET /graphiql/main.js - 200, JavaScript (schema unspecified). */
  async mainScript(): Promise<APIResponse> {
    return this.get('/graphiql/main.js');
  }

  /** GET /graphiql/sw.js - 200, JavaScript (schema unspecified). */
  async serviceWorkerScript(): Promise<APIResponse> {
    return this.get('/graphiql/sw.js');
  }

  /** GET /graphiql/config.js - 200, JavaScript (schema unspecified). */
  async configScript(): Promise<APIResponse> {
    return this.get('/graphiql/config.js');
  }
}
