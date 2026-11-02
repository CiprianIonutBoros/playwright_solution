/** Lab profiles DemoShop offers, in API order. Tests expect `baseline` to stay active. */
export const activeLabProfile = 'baseline';

export const labProfiles = [
  { id: 'baseline', name: 'Baseline', summary: 'The documented store contract with a repeatable seed dataset.' },
  { id: 'functional_defects', name: 'Functional defects', summary: 'A controlled set of reproducible store workflow issues.' },
  { id: 'performance_regression', name: 'Performance regression', summary: 'A repeatable slow-path for measuring and comparing workloads.' },
  { id: 'authorization_mistakes', name: 'Authorization mistakes', summary: 'A local synthetic-data exercise about resource ownership.' },
  { id: 'concurrency_idempotency', name: 'Concurrency and idempotency', summary: 'Parallel writes and safe retry behavior.' },
  { id: 'contract_mismatch', name: 'Contract mismatch', summary: 'A controlled mismatch between a published contract and a response.' },
  { id: 'provider_resilience', name: 'Provider resilience', summary: 'Retry and recovery behavior for the simulated payment provider.' },
];
