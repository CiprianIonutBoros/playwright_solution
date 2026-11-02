import { test, expect } from '../../src/fixtures/api';

const rootTypeQuery = { query: 'query RootType { __typename }', operationName: 'RootType' };

// GraphQL is public. Both tests run the same small query to cover the GET and POST transports.
test.describe('GraphQL', () => {
  // Sends the query in the URL and expects the root type name with no errors.
  test('answers a query sent with GET', async ({ systemService }) => {
    const result = await systemService.graphQLQuery(rootTypeQuery);
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ __typename: 'Query' });
  });

  // Sends the query in a JSON body and expects the same answer.
  test('answers a query sent with POST', async ({ systemService }) => {
    const result = await systemService.graphQLExecute(rootTypeQuery);
    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ __typename: 'Query' });
  });
});
