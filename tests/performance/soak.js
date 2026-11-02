import { browseStore, demoOptions } from './helpers/storefront.js';
import { createSummary } from './helpers/report.js';

// Keeps one virtual user browsing for one minute to demonstrate sustained traffic.
// A real endurance run lasts hours and needs time-series metrics to identify degradation.
// Each iteration calls GET /health, searches GET /api/v1/products?search=<seed notebook name>,
// then fetches GET /api/v1/products/<seed product ID>.
export const options = {
  ...demoOptions,
  scenarios: {
    shortened_soak: {
      executor: 'constant-vus',
      vus: 1,
      duration: '60s',
      gracefulStop: '2s',
    },
  },
};

export const handleSummary = createSummary('Soak / endurance', options);

export default browseStore;
