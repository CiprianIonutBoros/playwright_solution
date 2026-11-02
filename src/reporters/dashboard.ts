import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type {
  FullConfig, FullResult, Reporter, Suite, TestError, TestResult, TestStep,
} from '@playwright/test/reporter';

type Status = 'passed' | 'failed' | 'flaky' | 'skipped' | 'not-run';
type Attempt = {
  status: string;
  retry: number;
  duration: number;
  errors: string[];
  steps: string;
  attachments: { name: string; href: string }[];
};
type Entry = {
  title: string;
  project: string;
  file: string;
  status: Status;
  expectedStatus: string;
  duration: number;
  attempts: Attempt[];
};

export type DashboardData = {
  status: string;
  startedAt: string;
  duration: number;
  workers: number;
  tests: Entry[];
  errors: string[];
};

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function durationLabel(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

function errorText(error: TestError) {
  return (error.stack || error.message || error.value || 'Unknown error')
    .replace(/\u001b\[[0-9;]*m/g, '');
}

function renderSteps(steps: TestStep[]): string {
  return steps.length ? `<ul class="steps">${steps.map(step => `<li>
    <span class="${step.error ? 'failed' : ''}">${escapeHtml(step.title)}</span>
    <small>${durationLabel(step.duration)}</small>
    ${renderSteps(step.steps)}
  </li>`).join('')}</ul>` : '';
}

export function renderDashboard(data: DashboardData) {
  const counts = (status: Status) => data.tests.filter(test => test.status === status).length;
  const projects = [...new Set(data.tests.map(test => test.project))].sort();
  const cards = [
    ['Total tests', data.tests.length, ''],
    ['Passed', counts('passed'), 'passed'],
    ['Failed', counts('failed'), 'failed'],
    ['Flaky', counts('flaky'), 'flaky'],
    ['Skipped / not run', counts('skipped') + counts('not-run'), 'skipped'],
  ];
  const tests = data.tests.map(test => `<details class="test" data-project="${escapeHtml(test.project)}" data-status="${test.status}">
    <summary>
      <span class="badge ${test.status}">${test.status}</span>
      <span class="test-title">${escapeHtml(test.title)}<small>${escapeHtml(test.project)} &middot; ${escapeHtml(test.file)}</small></span>
      <span class="time">${durationLabel(test.duration)}</span>
    </summary>
    <div class="test-body">
      <p class="muted">Expected result: ${escapeHtml(test.expectedStatus)} &middot; ${test.attempts.length} attempt(s)</p>
      ${test.attempts.length === 0 ? '<p class="muted">This test did not run.</p>' : ''}
      ${test.attempts.map(attempt => `<details class="attempt">
        <summary>Attempt ${attempt.retry + 1} &middot; ${escapeHtml(attempt.status)} &middot; ${durationLabel(attempt.duration)}</summary>
        ${attempt.errors.map(error => `<pre class="error">${escapeHtml(error)}</pre>`).join('')}
        ${attempt.attachments.length ? `<ul class="attachments">${attempt.attachments.map(attachment =>
          `<li><a href="${escapeHtml(attachment.href)}">${escapeHtml(attachment.name)}</a></li>`).join('')}</ul>` : ''}
        ${attempt.steps || '<p class="muted">No steps recorded.</p>'}
      </details>`).join('')}
    </div>
  </details>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(projects.join(' + ') || 'Playwright')} | Test report</title>
<style>
  :root { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #e5eaf3; background: #0b1120; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  main { max-width: 1200px; margin: auto; padding: 32px; }
  header, .hero, .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
  header { color: #9aa8bc; font-size: 11px; }
  .brand { display: flex; align-items: center; gap: 12px; color: #e5eaf3; font-weight: 800; letter-spacing: .12em; }
  .mark { padding: 9px; border-radius: 9px; background: #172337; color: #75f0cf; letter-spacing: 0; }
  .hero { margin: 48px 0 28px; }
  .eyebrow { color: #9aa8bc; font-size: 11px; font-weight: 800; letter-spacing: .14em; }
  h1 { margin: 10px 0; font-size: clamp(30px, 5vw, 48px); letter-spacing: -.05em; }
  h2 { font-size: 16px; margin: 0; }
  .muted, .hero p { color: #9aa8bc; font-size: 13px; line-height: 1.6; }
  .hero p { margin: 0; }
  .verdict { padding: 14px 20px; border: 1px solid #28364c; border-radius: 12px; background: #111a2b; font-weight: 800; text-transform: uppercase; }
  .cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .card, .panel { padding: 20px; border: 1px solid #28364c; border-radius: 14px; background: #111a2b; box-shadow: 0 8px 24px #00000020; }
  .card span { font-size: 11px; font-weight: 700; color: #9aa8bc; }
  .card strong { display: block; margin-top: 16px; font-size: 34px; }
  .passed { color: #34d399; }
  .failed, .timedout, .interrupted { color: #fb7185; }
  .flaky { color: #fbbf24; }
  .skipped, .not-run { color: #9aa8bc; }
  .panel { margin-top: 16px; }
  .filters { display: grid; grid-template-columns: 1fr 180px 160px; gap: 12px; margin: 20px 0; }
  label { display: grid; gap: 7px; color: #9aa8bc; font-size: 11px; font-weight: 700; }
  input, select { width: 100%; min-width: 0; padding: 11px; border: 1px solid #28364c; border-radius: 8px; background: #172337; color: #e5eaf3; font: inherit; font-size: 13px; }
  .test { border-top: 1px solid #28364c; }
  summary { cursor: pointer; }
  .test > summary { display: flex; align-items: center; gap: 14px; padding: 17px 0; }
  .badge { flex: 0 0 76px; padding: 6px; border-radius: 6px; background: #1b2940; text-align: center; font-size: 10px; font-weight: 800; text-transform: uppercase; }
  .test-title { min-width: 0; flex: 1; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }
  .test-title small { display: block; margin-top: 7px; color: #9aa8bc; font-size: 11px; font-weight: 400; }
  .time { color: #9aa8bc; font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .test-body { padding: 0 0 20px; }
  .attempt { margin-top: 12px; padding: 14px; background: #172337; border-radius: 8px; font-size: 12px; }
  .steps { padding-left: 20px; line-height: 1.8; overflow-wrap: anywhere; }
  .steps small { margin-left: 12px; color: #9aa8bc; white-space: nowrap; }
  pre { padding: 16px; overflow: auto; border-radius: 8px; background: #301a28; font-size: 12px; line-height: 1.6; }
  a { color: #75f0cf; }
  footer { margin-top: 22px; color: #9aa8bc; font-size: 11px; }
  [hidden] { display: none !important; }
  @media (max-width: 760px) {
    main { padding: 20px 14px; }
    header, .hero { align-items: flex-start; flex-direction: column; }
    .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .filters { grid-template-columns: 1fr; }
    .test > summary { gap: 8px; }
    .badge { flex-basis: 62px; }
  }
  @media print { .filters { display: none; } .card, .panel { box-shadow: none; } }
</style>
</head>
<body>
<main>
  <header><span class="brand"><span class="mark">PW</span>DEMOSHOP / TEST LAB</span><time>${escapeHtml(data.startedAt)}</time></header>
  <section class="hero">
    <div><div class="eyebrow">PLAYWRIGHT RUN REPORT</div><h1>${escapeHtml(projects.join(' + ').toUpperCase() || 'Playwright')} tests</h1>
    <p>${durationLabel(data.duration)} wall time &middot; up to ${data.workers} workers &middot; ${data.tests.length} tests</p></div>
    <div class="verdict ${escapeHtml(data.status)}">${escapeHtml(data.status)}</div>
  </section>
  <section class="cards" aria-label="Run totals">${cards.map(([label, count, status]) =>
    `<article class="card"><span>${label}</span><strong class="${status}">${count}</strong></article>`).join('')}</section>
  ${data.errors.length ? `<section class="panel"><h2>Run errors</h2>${data.errors.map(error => `<pre>${escapeHtml(error)}</pre>`).join('')}</section>` : ''}
  <section class="panel">
    <div class="panel-heading"><h2>Test results</h2><span class="muted" id="visible-count">${data.tests.length} shown</span></div>
    <div class="filters">
      <label>Search tests<input id="search" type="search" placeholder="Test name, file, or project"></label>
      <label>Project<select id="project" aria-label="Project"><option value="">All projects</option>${projects.map(project => `<option>${escapeHtml(project)}</option>`).join('')}</select></label>
      <label>Status<select id="status" aria-label="Status"><option value="">All statuses</option>${['passed', 'failed', 'flaky', 'skipped', 'not-run'].map(status => `<option>${status}</option>`).join('')}</select></label>
    </div>
    ${tests}
    <p id="empty" class="muted"${data.tests.length ? ' hidden' : ''}>No matching tests.</p>
  </section>
  <footer>Expand a test, then an attempt, for steps, errors, and attachments. Totals describe the full run; filters affect the list only.</footer>
</main>
<script>
  const search = document.getElementById('search');
  const project = document.getElementById('project');
  const status = document.getElementById('status');
  const tests = [...document.querySelectorAll('.test')];
  function filter() {
    let visible = 0;
    for (const test of tests) {
      test.hidden = !(test.querySelector('.test-title').textContent.toLowerCase().includes(search.value.toLowerCase()) &&
        (!project.value || test.dataset.project === project.value) && (!status.value || test.dataset.status === status.value));
      if (!test.hidden) visible++;
    }
    document.getElementById('visible-count').textContent = visible + ' shown';
    document.getElementById('empty').hidden = visible !== 0;
  }
  search.addEventListener('input', filter);
  project.addEventListener('change', filter);
  status.addEventListener('change', filter);
</script>
</body>
</html>`;
}

export default class DashboardReporter implements Reporter {
  private config!: FullConfig;
  private suite?: Suite;
  private errors: string[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
  }

  onError(error: TestError) {
    this.errors.push(errorText(error));
  }

  onEnd(result: FullResult) {
    const output = path.resolve('test-dashboard');
    mkdirSync(path.join(output, 'data'), { recursive: true });
    let attachmentIndex = 0;
    const tests: Entry[] = (this.suite?.allTests() || []).map(test => {
      const outcome = test.outcome();
      const status: Status = test.results.length === 0 ? 'not-run'
        : outcome === 'unexpected' ? 'failed'
          : outcome === 'expected' ? 'passed' : outcome;
      return {
        title: test.titlePath().filter(Boolean).join(' / '),
        project: test.parent.project()?.name || 'unknown',
        file: `${path.relative(this.config.rootDir, test.location.file)}:${test.location.line}`,
        status,
        expectedStatus: test.expectedStatus,
        duration: test.results.reduce((total, attempt) => total + attempt.duration, 0),
        attempts: test.results.map((attempt: TestResult) => ({
          status: attempt.status,
          retry: attempt.retry,
          duration: attempt.duration,
          errors: attempt.errors.map(errorText),
          steps: renderSteps(attempt.steps),
          attachments: attempt.attachments.map(attachment => {
            const extension = attachment.path ? path.extname(attachment.path) : '.txt';
            const name = `${++attachmentIndex}${extension}`;
            const destination = path.join(output, 'data', name);
            if (attachment.path) {
              copyFileSync(attachment.path, destination);
            } else if (attachment.body) {
              writeFileSync(destination, attachment.body);
            } else {
              throw new Error(`Attachment "${attachment.name}" has neither a path nor a body.`);
            }
            return { name: attachment.name, href: `data/${encodeURIComponent(name)}` };
          }),
        })),
      };
    });
    writeFileSync(path.join(output, 'index.html'), renderDashboard({
      status: result.status,
      startedAt: result.startTime.toISOString(),
      duration: result.duration,
      workers: this.config.workers,
      tests,
      errors: this.errors,
    }));
    console.log(`\nTest dashboard: ${path.join(output, 'index.html')}`);
  }
}
