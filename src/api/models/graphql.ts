export interface GraphQLQueryParameters {
  query?: string;
  persisted?: boolean;
  operationName?: string | null;
  /** JSON-encoded variables for GET requests. */
  variables?: string;
  /** JSON-encoded extensions for GET requests. */
  extensions?: string;
}

export interface GraphQLRequest {
  query?: string;
  persisted?: boolean;
  operationName?: string | null;
  variables?: Record<string, unknown> | null;
  extensions?: Record<string, unknown>;
}

export interface GraphQLError {
  message: string;
  locations?: {
    line?: number;
    column?: number;
  }[];
  path?: string[];
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}

export interface GraphQLResponse {
  data?: Record<string, unknown> | null;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}
