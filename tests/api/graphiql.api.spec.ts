import { test, expect } from '../../src/fixtures/test';

const editorHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>GraphiQL</title>
  <meta name="robots" content="noindex"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
    #main {
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="main"></div>
  <script src="./graphiql/config.js"></script>
  <script src="./graphiql/main.js"></script>
</body>
</html>
`;

// The GraphiQL editor and its scripts are public files, so no token is sent.
test.describe('GraphiQL editor', () => {
  // Loads the editor page and checks its exact content type and exact HTML: title, mount element, and both scripts.
  test('serves the editor page', async ({ graphQLApi }) => {
    const response = await graphQLApi.editor();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('text/html; charset=utf-8');
    expect(await response.text()).toBe(editorHtml);
  });

  // Loads the editor application script.
  test('serves the editor script', async ({ graphQLApi }) => {
    const response = await graphQLApi.mainScript();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/javascript; charset=utf-8');
    expect(await response.text()).toContain('GraphiQL');
  });

  // Loads the service worker. It must cache the GraphiQL 3.8.3 assets the editor uses.
  test('serves the service worker', async ({ graphQLApi }) => {
    const response = await graphQLApi.serviceWorkerScript();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/javascript; charset=utf-8');
    const script = await response.text();
    expect(script).toContain("caches.open('graphiql-v3.8.3')");
    expect(script).toContain("'https://unpkg.com/graphiql@3.8.3/graphiql.min.js'");
  });

  // Loads the config script. It must point the editor at /graphql with no plugins, and nothing else.
  test('config points the editor at the GraphQL endpoint', async ({ graphQLApi }) => {
    const response = await graphQLApi.configScript();
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('application/javascript');
    expect(await response.text()).toBe("window.GRAPHQL_ENDPOINT = '/graphql';\nwindow.GRAPHIQL_PLUGIN_LIST = []");
  });
});
