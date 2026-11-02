import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Ramps above the two-user demo baseline, then back down to demonstrate recovery.
// Four virtual users is a safety ceiling, not the application's actual stress limit.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  scenarios: {
    bounded_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 1 },
        { duration: '5s', target: 2 },
        { duration: '5s', target: 4 },
        { duration: '5s', target: 0 },
      ],
      gracefulRampDown: '2s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Stress', options);

export default browseStore;
