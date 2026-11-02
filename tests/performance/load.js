import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Two virtual users represent this demo's normal demand, not measured production traffic.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  scenarios: {
    average_load: {
      executor: 'constant-vus',
      vus: 2,
      duration: '12s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Average load', options);

export default browseStore;
