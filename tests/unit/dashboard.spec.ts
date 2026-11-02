import { test, expect } from '@playwright/test';
import { renderDashboard, type DashboardData } from '../../src/reporters/dashboard';

test('dashboard preserves outcomes, retries, errors, and escaped content', () => {
  const data: DashboardData = {
    status: 'failed',
    startedAt: '2026-10-29T06:00:00.000Z',
    duration: 1234,
    workers: 2,
    errors: ['Setup <script>alert("unsafe")</script>'],
    tests: [
      {
        title: 'API <script>test</script>',
        project: 'api',
        file: 'api/example.ts:10',
        status: 'flaky',
        expectedStatus: 'passed',
        duration: 1200,
        attempts: [
          { status: 'failed', retry: 0, duration: 1000, errors: ['Expected <200>'], steps: '', attachments: [] },
          {
            status: 'passed', retry: 1, duration: 200, errors: [], steps: '',
            attachments: [{ name: 'Screenshot <image>', href: 'data/1.png' }],
          },
        ],
      },
      {
        title: 'Combined test', project: 'combined', file: 'combined/example.ts:1',
        status: 'not-run', expectedStatus: 'passed', duration: 0, attempts: [],
      },
    ],
  };
  const html = renderDashboard(data);
  expect(html).toContain('color-scheme: dark');
  expect(html).toContain('background: #0b1120');
  expect(html).toContain('API + COMBINED tests');
  expect(html).toContain('data-status="flaky"');
  expect(html).toContain('data-status="not-run"');
  expect(html).toContain('Attempt 2 &middot; passed');
  expect(html).toContain('Expected &lt;200&gt;');
  expect(html).toContain('API &lt;script&gt;test&lt;/script&gt;');
  expect(html).toContain('Setup &lt;script&gt;');
  expect(html).toContain('href="data/1.png"');
  expect(html).toContain('This test did not run.');
  expect(html).not.toContain('<script>alert');
});

test('dashboard renders empty runs with explicit errors', () => {
  const html = renderDashboard({
    status: 'failed', startedAt: '2026-10-29T06:00:00.000Z',
    duration: 0, workers: 1, tests: [], errors: ['No tests found'],
  });
  expect(html).toContain('Playwright tests');
  expect(html).toContain('No tests found');
  expect(html).toContain('id="empty" class="muted">No matching tests.');
});
