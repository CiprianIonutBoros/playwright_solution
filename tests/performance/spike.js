import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Jumps from one to four virtual users in one second, then returns to baseline.
// The abrupt shape demonstrates a spike without sending a large burst of traffic.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  scenarios: {
    bounded_spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '5s', target: 1 },
        { duration: '1s', target: 4 },
        { duration: '5s', target: 4 },
        { duration: '1s', target: 1 },
        { duration: '5s', target: 1 },
      ],
      gracefulRampDown: '2s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Spike', options);

export default browseStore;
