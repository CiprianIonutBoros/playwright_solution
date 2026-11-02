import type { GraphQLApi } from '../clients/GraphQLApi';
import type { SystemApi } from '../clients/SystemApi';
import type { GraphQLQueryParameters, GraphQLRequest, GraphQLResponse } from '../models/graphql';
import type { HealthStatus } from '../models/system';
import { readJson } from './serviceResponse';

/** Health check and GraphQL. GraphiQL assets stay on GraphQLApi. */
export class SystemService {
  constructor(private readonly api: SystemApi, private readonly graphQLApi: GraphQLApi) {}

  /** GET /health - 200. */
  async health(): Promise<HealthStatus> {
    return readJson<HealthStatus>(await this.api.health(), 200, 'Health check');
  }

  /** GET /graphql - 200. */
  async graphQLQuery(parameters: GraphQLQueryParameters): Promise<GraphQLResponse> {
    return readJson<GraphQLResponse>(await this.graphQLApi.query(parameters), 200, 'GraphQL GET');
  }

  /** POST /graphql - 200. */
  async graphQLExecute(body: GraphQLRequest): Promise<GraphQLResponse> {
    return readJson<GraphQLResponse>(await this.graphQLApi.execute(body), 200, 'GraphQL POST');
  }
}
