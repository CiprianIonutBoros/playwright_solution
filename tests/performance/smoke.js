import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Proves the shared browsing script and its checks work with one virtual user.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '6s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Smoke', options);

export default browseStore;
