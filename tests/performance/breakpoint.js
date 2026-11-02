import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Demonstrates threshold-triggered stopping under a bounded ramp.
// If no threshold fails before four users, this demo has NOT found the application's breakpoint.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  thresholds: {
    ...demoOptions.thresholds,
    http_req_duration: [{
      threshold: 'p(95)<1000',
      abortOnFail: true,
      delayAbortEval: '5s',
    }],
    http_req_failed: [{
      threshold: 'rate<0.01',
      abortOnFail: true,
      delayAbortEval: '5s',
    }],
    checks: [{
      threshold: 'rate==1',
      abortOnFail: true,
      delayAbortEval: '5s',
    }],
  },
  scenarios: {
    bounded_breakpoint: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5s', target: 1 },
        { duration: '5s', target: 2 },
        { duration: '5s', target: 3 },
        { duration: '5s', target: 4 },
      ],
      gracefulRampDown: '2s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Breakpoint', options);

export default browseStore;
