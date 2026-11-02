import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Equal-length, non-overlapping tiers expose latency and completed iterations at one, two, and four users.
// This measures a load-scaling demonstration; it does not provision resources or prove resource-scaling efficiency.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  thresholds: {
    ...demoOptions.thresholds,
    'http_req_duration{scenario:one_user}': ['p(95)<1000'],
    'http_req_duration{scenario:two_users}': ['p(95)<1000'],
    'http_req_duration{scenario:four_users}': ['p(95)<1000'],
    'iterations{scenario:one_user}': ['count>0'],
    'iterations{scenario:two_users}': ['count>0'],
    'iterations{scenario:four_users}': ['count>0'],
  },
  scenarios: {
    one_user: {
      executor: 'constant-vus',
      vus: 1,
      duration: '6s',
      gracefulStop: '2s',
    },
    two_users: {
      executor: 'constant-vus',
      startTime: '8s',
      vus: 2,
      duration: '6s',
      gracefulStop: '2s',
    },
    four_users: {
      executor: 'constant-vus',
      startTime: '16s',
      vus: 4,
      duration: '6s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Scalability', options);

export default browseStore;
