function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function getValue(data, metric, field) {
  const value = data.metrics[metric]?.values?.[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatNumber(value, digits = 0) {
  if (value === null) {
    return '—';
  }

  const [integer, fraction] = value.toFixed(digits).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

function formatPercent(value) {
  return value === null ? '—' : `${formatNumber(value * 100, 2)}%`;
}

function renderThresholds(metrics) {
  const thresholds = Object.entries(metrics).flatMap(([name, metric]) =>
    Object.entries(metric.thresholds || {}).map(([expression, result]) => ({
      name,
      expression,
      passed: result.ok,
    })),
  );

  if (thresholds.length === 0) {
    return '<p class="empty">No thresholds were reported.</p>';
  }

  return `<ul class="thresholds">${thresholds.map(({ name, expression, passed }) => `
    <li>
      <span class="threshold-status ${passed ? 'passed' : 'failed'}">${passed ? 'PASS' : 'FAIL'}</span>
      <span class="threshold-name">${escapeHtml(name)}</span>
      <code>${escapeHtml(expression)}</code>
    </li>`).join('')}
  </ul>`;
}

function formatMetricValue(metric, field, value) {
  if (metric.type === 'rate' && field === 'rate') {
    return formatPercent(value);
  }
  const isCount = ['count', 'passes', 'fails'].includes(field);
  const formatted = formatNumber(value, isCount || Number.isInteger(value) ? 0 : 2);
  if (metric.type === 'counter' && field === 'rate') {
    return `${formatted} ${metric.contains === 'data' ? 'B/s' : '/s'}`;
  }
  if (!isCount && metric.contains === 'time') {
    return `${formatted} ms`;
  }
  if (!isCount && metric.contains === 'data') {
    return `${formatted} B`;
  }
  if (isCount && metric.contains === 'data') {
    return `${formatted} B`;
  }
  return formatted;
}

function renderMetrics(metrics) {
  const fieldOrder = ['count', 'rate', 'passes', 'fails', 'value', 'avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'];
  const rows = Object.entries(metrics).sort(([left], [right]) => left.localeCompare(right))
    .map(([name, metric]) => `<tr>
      <th scope="row">${escapeHtml(name)}</th>
      <td>${escapeHtml(metric.type)}</td>
      <td>${escapeHtml(metric.contains)}</td>
      <td><dl class="metric-values">${Object.entries(metric.values)
        .sort(([left], [right]) => {
          const leftIndex = fieldOrder.indexOf(left);
          const rightIndex = fieldOrder.indexOf(right);
          return (leftIndex < 0 ? fieldOrder.length : leftIndex) -
            (rightIndex < 0 ? fieldOrder.length : rightIndex) || left.localeCompare(right);
        })
        .map(([field, value]) => `
        <div><dt>${escapeHtml(field)}</dt><dd title="${escapeHtml(value)}">${escapeHtml(formatMetricValue(metric, field, value))}</dd></div>`).join('')}</dl></td>
    </tr>`).join('');
  return `<div class="table-scroll"><table class="all-metrics-table">
    <caption>All metrics, including tagged scenarios. Values rounded to two decimals; rate metrics shown as percentages. Hover over a value or expand raw data for full precision.</caption>
    <thead><tr><th>Metric</th><th>Type</th><th>Contains</th><th>Values</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}

function renderChecks(group) {
  const rows = [];
  function visit(current, parent) {
    const path = [parent, current.name].filter(Boolean).join(' / ');
    for (const check of current.checks) {
      const total = check.passes + check.fails;
      rows.push(`<tr>
        <th scope="row">${escapeHtml(check.name)}</th>
        <td>${escapeHtml(path || 'Root')}</td>
        <td>${formatNumber(check.passes)}</td>
        <td>${formatNumber(check.fails)}</td>
        <td>${formatPercent(total > 0 ? check.passes / total : null)}</td>
      </tr>`);
    }
    for (const child of current.groups) {
      visit(child, path);
    }
  }
  visit(group, '');
  if (rows.length === 0) {
    return '<p class="empty">No checks were reported.</p>';
  }
  return `<div class="table-scroll"><table>
    <thead><tr><th>Check</th><th>Group</th><th>Passed</th><th>Failed</th><th>Pass rate</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>`;
}

export function createSummary(testName, profile) {
  return data => renderReport(data, testName, profile);
}

function renderReport(data, testName, profile) {
  const thresholdResults = Object.values(data.metrics).flatMap(metric =>
    Object.values(metric.thresholds || {}).map(result => result.ok),
  );
  const status = thresholdResults.length === 0
    ? 'UNVERIFIED'
    : thresholdResults.every(Boolean) ? 'PASS' : 'FAIL';
  const duration = data.state.testRunDurationMs;
  const requestCount = getValue(data, 'http_reqs', 'count');
  const iterationCount = getValue(data, 'iterations', 'count');
  const p95 = getValue(data, 'http_req_duration', 'p(95)');
  const failureRate = getValue(data, 'http_req_failed', 'rate');
  const checkRate = getValue(data, 'checks', 'rate');
  const requestRate = getValue(data, 'http_reqs', 'rate');
  const maxVus = getValue(data, 'vus', 'max');
  const date = new Date().toISOString();
  const heading = escapeHtml(`${testName} test`);
  const durationLabel = duration === undefined
    ? '—'
    : `${formatNumber(duration / 1000, 1)}s`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${heading} | k6 report</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b1120;
      color: #e5eaf3;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; background: #0b1120; }
    .shell { max-width: 1120px; margin: 0 auto; padding: 28px 32px 48px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #9aa8bc; font-size: 11px; font-weight: 800; letter-spacing: .14em; }
    .brand { display: flex; align-items: center; gap: 10px; color: #e5eaf3; }
    .brand-mark { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; background: #172337; color: #75f0cf; font-size: 13px; letter-spacing: 0; }
    .run-date { font-weight: 600; letter-spacing: 0; }
    .hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin: 58px 0 34px; }
    .eyebrow { color: #9aa8bc; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: 10px 0; font-size: clamp(32px, 5vw, 52px); line-height: 1.05; letter-spacing: -.055em; }
    .subtitle { margin: 0; color: #9aa8bc; font-size: 14px; }
    .verdict { display: flex; min-width: 160px; align-items: center; gap: 12px; padding: 16px 19px; border: 1px solid #28364c; border-radius: 14px; background: #111a2b; box-shadow: 0 8px 24px #00000020; }
    .verdict-dot { width: 11px; height: 11px; flex: 0 0 auto; border-radius: 50%; background: #8290a4; }
    .verdict.pass .verdict-dot { background: #34d399; box-shadow: 0 0 0 5px #34d3991a; }
    .verdict.fail .verdict-dot { background: #fb7185; box-shadow: 0 0 0 5px #fb71851a; }
    .verdict strong { display: block; font-size: 14px; letter-spacing: .06em; }
    .verdict small { display: block; margin-top: 4px; color: #9aa8bc; font-size: 11px; }
    .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .metric { min-height: 145px; padding: 20px; border: 1px solid #28364c; border-radius: 14px; background: #111a2b; box-shadow: 0 8px 24px #00000020; }
    .metric-label { color: #9aa8bc; font-size: 11px; font-weight: 800; letter-spacing: .11em; text-transform: uppercase; }
    .metric-value { margin-top: 22px; font-size: clamp(25px, 3vw, 34px); font-weight: 750; letter-spacing: -.05em; }
    .metric-unit { margin-left: 5px; color: #9aa8bc; font-size: 13px; font-weight: 600; letter-spacing: 0; }
    .metric-note { margin-top: 6px; color: #8291a7; font-size: 12px; }
    .lower { display: grid; grid-template-columns: 1.5fr 1fr; gap: 14px; margin-top: 14px; }
    .panel { padding: 22px; border: 1px solid #28364c; border-radius: 14px; background: #111a2b; box-shadow: 0 8px 24px #00000020; }
    .panel-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    h2 { margin: 0; font-size: 15px; letter-spacing: -.02em; }
    .panel-caption { color: #8291a7; font-size: 11px; }
    .thresholds { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
    .thresholds li { display: grid; grid-template-columns: 48px minmax(100px, 1fr) minmax(110px, 1.2fr); align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #28364c; }
    .threshold-status { font-size: 10px; font-weight: 900; letter-spacing: .08em; }
    .threshold-status.passed { color: #34d399; }
    .threshold-status.failed { color: #fb7185; }
    .threshold-name { overflow: hidden; color: #d3dbea; font-size: 12px; text-overflow: ellipsis; }
    code { justify-self: end; padding: 5px 7px; border-radius: 6px; background: #1b2940; color: #c1ccdc; font-size: 11px; white-space: nowrap; }
    .facts { display: grid; gap: 15px; margin: 0; }
    .fact { display: flex; justify-content: space-between; gap: 16px; color: #9aa8bc; font-size: 12px; }
    .fact dd { margin: 0; color: #e5eaf3; font-weight: 700; text-align: right; }
    .empty { color: #8291a7; font-size: 13px; }
    .section { margin-top: 14px; min-width: 0; }
    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
    caption { padding-bottom: 16px; color: #9aa8bc; text-align: left; line-height: 1.6; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #28364c; vertical-align: top; overflow-wrap: anywhere; }
    thead th { color: #9aa8bc; font-size: 11px; }
    tbody th { font-weight: 600; }
    .all-metrics-table { min-width: 850px; table-layout: fixed; }
    .all-metrics-table th:first-child { width: 25%; }
    .all-metrics-table th:nth-child(2) { width: 9%; }
    .all-metrics-table th:nth-child(3) { width: 9%; }
    .all-metrics-table td:nth-child(2), .all-metrics-table td:nth-child(3) { white-space: nowrap; color: #9aa8bc; }
    .all-metrics-table tbody th { line-height: 1.6; }
    .metric-values { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 0; }
    .metric-values div { min-width: 0; padding: 8px 10px; border-radius: 6px; background: #1b2940; }
    .metric-values dt { margin-bottom: 4px; color: #9aa8bc; font-size: 10px; }
    .metric-values dd { margin: 0; color: #e5eaf3; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
    details + details { margin-top: 16px; }
    summary { cursor: pointer; font-size: 13px; font-weight: 700; }
    pre { max-height: 480px; overflow: auto; padding: 16px; border-radius: 8px; background: #172337; font-size: 12px; line-height: 1.6; }
    footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 22px; color: #8291a7; font-size: 11px; }
    @media (max-width: 760px) {
      .shell { padding: 20px 16px 32px; }
      .hero { align-items: flex-start; flex-direction: column; margin-top: 42px; }
      .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .lower { grid-template-columns: 1fr; }
    }
    @media (max-width: 420px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      .metrics { grid-template-columns: 1fr; }
      .thresholds li { grid-template-columns: 42px 1fr; }
      .thresholds code { grid-column: 2; justify-self: start; }
      footer { flex-direction: column; }
    }
    @media print {
      body, :root { background: #0b1120; }
      .shell { max-width: none; padding: 0; }
      .metric, .panel, .verdict { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">k6</span><span>DEMOSHOP / PERFORMANCE</span></div>
      <span class="run-date">${date}</span>
    </header>
    <section class="hero">
      <div>
        <div class="eyebrow">RUN REPORT / ${durationLabel}</div>
        <h1>${heading}</h1>
        <p class="subtitle">A quick read on latency, reliability, and test health.</p>
      </div>
      <div class="verdict ${status.toLowerCase()}">
        <span class="verdict-dot"></span>
        <div><strong>${status}</strong><small>threshold evaluation</small></div>
      </div>
    </section>
    <section class="metrics" aria-label="Run metrics">
      <article class="metric">
        <div class="metric-label">p95 latency</div>
        <div class="metric-value">${formatNumber(p95, 1)}<span class="metric-unit">ms</span></div>
        <div class="metric-note">95% of requests completed within this time</div>
      </article>
      <article class="metric">
        <div class="metric-label">Requests</div>
        <div class="metric-value">${formatNumber(requestCount)}</div>
        <div class="metric-note">${formatNumber(requestRate, 2)} requests per second</div>
      </article>
      <article class="metric">
        <div class="metric-label">Failed requests</div>
        <div class="metric-value">${formatPercent(failureRate)}</div>
        <div class="metric-note">HTTP request failure rate</div>
      </article>
      <article class="metric">
        <div class="metric-label">Checks passed</div>
        <div class="metric-value">${formatPercent(checkRate)}</div>
        <div class="metric-note">${formatNumber(iterationCount)} completed iterations</div>
      </article>
    </section>
    <section class="lower">
      <article class="panel">
        <div class="panel-head"><h2>Thresholds</h2><span class="panel-caption">k6 evaluation</span></div>
        ${renderThresholds(data.metrics)}
      </article>
      <article class="panel">
        <div class="panel-head"><h2>Run facts</h2><span class="panel-caption">observed totals</span></div>
        <dl class="facts">
          <div class="fact"><dt>Test name</dt><dd>${escapeHtml(testName)}</dd></div>
          <div class="fact"><dt>Peak virtual users</dt><dd>${formatNumber(maxVus)}</dd></div>
          <div class="fact"><dt>Iterations</dt><dd>${formatNumber(iterationCount)}</dd></div>
          <div class="fact"><dt>Requests / second</dt><dd>${formatNumber(requestRate, 2)}</dd></div>
          <div class="fact"><dt>Run duration</dt><dd>${durationLabel}</dd></div>
        </dl>
      </article>
    </section>
    <section class="panel section" aria-labelledby="all-metrics">
      <div class="panel-head"><h2 id="all-metrics">All metrics</h2><span class="panel-caption">${Object.keys(data.metrics).length} metrics</span></div>
      ${renderMetrics(data.metrics)}
    </section>
    <section class="panel section" aria-labelledby="check-results">
      <div class="panel-head"><h2 id="check-results">Check results</h2><span class="panel-caption">all groups</span></div>
      ${renderChecks(data.root_group)}
    </section>
    <section class="panel section" aria-labelledby="run-data">
      <div class="panel-head"><h2 id="run-data">Run data</h2><span class="panel-caption">complete summary</span></div>
      <p class="empty">Summary aggregates only. Individual requests and time-series samples are not included by k6 handleSummary.</p>
      <details>
        <summary>Declared test profile</summary>
        <pre>${escapeHtml(JSON.stringify(profile, null, 2))}</pre>
      </details>
      <details>
        <summary>Raw k6 summary: metrics, groups, options, and state</summary>
        <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </details>
    </section>
    <footer><span>Generated by k6 handleSummary</span><span>${date}</span></footer>
  </main>
</body>
</html>`;

  return { 'k6-report.html': html };
}
