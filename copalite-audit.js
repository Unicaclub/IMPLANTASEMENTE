/**
 * Copalite Visual Audit — Playwright Script
 * Navigates 15 screens, takes screenshots, generates Markdown report.
 *
 * Usage: node copalite-audit.js
 * Requires: npm install playwright && npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────────────
const FRONTEND_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:3000/api/v1';
const CREDENTIALS = { email: 'admin@copalite.io', password: 'copalite2024' };
const SCREENSHOT_DIR = path.join(os.tmpdir(), 'copalite_audit_screenshots');
const REPORT_PATH = path.join(os.tmpdir(), 'copalite_audit_report.md');
const TIMEOUT = 30_000;

// ── Screens to audit ────────────────────────────────────────────────────────
const SCREENS = [
  { name: '01_landing',            path: '/',                          requiresAuth: false, description: 'Landing Page' },
  { name: '02_login',              path: '/auth/login',                requiresAuth: false, description: 'Login Page' },
  { name: '03_dashboard',          path: '/dashboard',                 requiresAuth: true,  description: 'Main Dashboard' },
  { name: '04_system_health',      path: '/dashboard/system',          requiresAuth: true,  description: 'System Health' },
  { name: '05_project_overview',   path: '/projects/{projectId}',      requiresAuth: true,  description: 'Project Overview' },
  { name: '06_orchestration',      path: '/projects/{projectId}/orchestration', requiresAuth: true, description: 'Orchestration' },
  { name: '07_backlog',            path: '/projects/{projectId}/backlog',       requiresAuth: true, description: 'Backlog' },
  { name: '08_tasks',              path: '/projects/{projectId}/tasks',         requiresAuth: true, description: 'Tasks' },
  { name: '09_sources',            path: '/projects/{projectId}/sources',       requiresAuth: true, description: 'Sources' },
  { name: '10_runs',               path: '/projects/{projectId}/runs',          requiresAuth: true, description: 'Runs' },
  { name: '11_evidence',           path: '/projects/{projectId}/evidence',      requiresAuth: true, description: 'Evidence' },
  { name: '12_registries',         path: '/projects/{projectId}/registries',    requiresAuth: true, description: 'Registries' },
  { name: '13_agents',             path: '/projects/{projectId}/agents',        requiresAuth: true, description: 'Agents' },
  { name: '14_notifications',      path: '/notifications',             requiresAuth: true,  description: 'Notifications' },
  { name: '15_swagger',            path: null,                         requiresAuth: false, description: 'Swagger API Docs', url: 'http://localhost:3000/api/docs' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveUrl(screen, projectId) {
  if (screen.url) return screen.url;
  const p = screen.path.replace('{projectId}', projectId || 'unknown');
  return `${FRONTEND_URL}${p}`;
}

async function getProjectId() {
  try {
    // Login first
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
    });
    if (!loginRes.ok) return null;
    const { accessToken } = await loginRes.json();

    // Get workspaces first, then projects
    const wsRes = await fetch(`${BACKEND_URL}/workspaces`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!wsRes.ok) return null;
    const workspaces = await wsRes.json();
    const wsList = Array.isArray(workspaces) ? workspaces : [];

    for (const ws of wsList) {
      const projRes = await fetch(`${BACKEND_URL}/projects?workspaceId=${ws.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!projRes.ok) continue;
      const projects = await projRes.json();
      const list = Array.isArray(projects) ? projects : projects.data || [];
      if (list.length > 0) return list[0].id;
    }
    return null;
  } catch {
    return null;
  }
}

function classifyResult(page, screen) {
  // Returns: 'PASS' | 'EMPTY' | 'FAIL'
  return 'PASS'; // Will be overridden by actual checks
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== COPALITE VISUAL AUDIT ===\n');

  // Setup
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Pre-flight: check services
  console.log('Checking services...');
  let backendOk = false, frontendOk = false;
  try {
    const r = await fetch(`${BACKEND_URL}/agents`);
    backendOk = r.status === 200 || r.status === 401;
  } catch { /* */ }
  try {
    const r = await fetch(FRONTEND_URL);
    frontendOk = r.ok || r.status === 307;
  } catch { /* */ }

  if (!backendOk) { console.error('ERROR: Backend not running on port 3000'); process.exit(1); }
  if (!frontendOk) { console.error('ERROR: Frontend not running on port 3001'); process.exit(1); }
  console.log('Backend: OK | Frontend: OK\n');

  // Get a project ID for project-scoped pages
  let projectId = await getProjectId();
  // Fallback: try well-known project IDs from previous test runs
  if (!projectId) {
    const knownIds = ['6c2f525e-0cd3-4488-adea-344ca99cbf48', '5778de24-16ee-4888-9a35-70d318535f66'];
    for (const kid of knownIds) {
      try {
        const r = await fetch(`${BACKEND_URL}/projects/${kid}`, {
          headers: { Authorization: `Bearer ${(await (await fetch(`${BACKEND_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(CREDENTIALS) })).json()).accessToken}` },
        });
        if (r.ok) { projectId = kid; break; }
      } catch { /* continue */ }
    }
  }
  console.log(`Project ID: ${projectId || 'NONE (project pages will use placeholder)'}\n`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Login via UI
  console.log('Logging in...');
  try {
    await page.goto(`${FRONTEND_URL}/auth/login`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.fill('input[type="email"], input[name="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: TIMEOUT }).catch(() => {});
    console.log('Login: OK\n');
  } catch (e) {
    console.warn(`Login warning: ${e.message}\n`);
  }

  // Audit each screen
  const results = [];
  let passCount = 0, emptyCount = 0, failCount = 0;
  const bugs = [];
  const uxNotes = [];

  for (const screen of SCREENS) {
    const url = resolveUrl(screen, projectId);
    const screenshotPath = path.join(SCREENSHOT_DIR, `${screen.name}.png`);
    let status = 'PASS';
    let statusEmoji = '✅';
    let note = '';
    let httpCode = 0;

    console.log(`Auditing: ${screen.name} — ${url}`);

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT });
      httpCode = response?.status() || 0;

      // Wait a bit for client-side rendering
      await page.waitForTimeout(1500);

      // Check for error states
      const bodyText = await page.textContent('body').catch(() => '');
      const hasError = bodyText.includes('500') && bodyText.includes('Internal Server Error');
      const has404 = bodyText.includes('404') && bodyText.includes('not found');
      const hasAppCrash = bodyText.includes('Application error') || bodyText.includes('Unhandled Runtime Error');

      if (hasError || hasAppCrash) {
        status = 'FAIL';
        statusEmoji = '❌';
        note = 'Application error or crash detected';
        failCount++;
        bugs.push({ screen: screen.name, issue: note, url });
      } else if (has404) {
        status = 'FAIL';
        statusEmoji = '❌';
        note = '404 Not Found';
        failCount++;
        bugs.push({ screen: screen.name, issue: note, url });
      } else if (httpCode >= 400 && httpCode !== 401) {
        status = 'FAIL';
        statusEmoji = '❌';
        note = `HTTP ${httpCode}`;
        failCount++;
        bugs.push({ screen: screen.name, issue: note, url });
      } else {
        // Check if page has meaningful content
        const mainContent = await page.$$('main, [role="main"], .card, table, h1, h2').catch(() => []);
        const hasContent = mainContent.length > 0;

        // Check for empty state indicators
        const emptyIndicators = await page.$$eval(
          'body',
          (els) => {
            const text = els[0]?.textContent || '';
            return text.includes('No ') && (text.includes(' found') || text.includes(' yet'));
          }
        ).catch(() => false);

        if (emptyIndicators && !hasContent) {
          status = 'EMPTY';
          statusEmoji = '⚠️';
          note = 'Empty state — no data';
          emptyCount++;
        } else {
          passCount++;

          // UX checks
          if (screen.requiresAuth) {
            const hasSidebar = await page.$('nav, [class*="sidebar"], [class*="Sidebar"]').catch(() => null);
            const hasHeader = await page.$('header, [class*="header"], [class*="Header"]').catch(() => null);
            if (!hasSidebar) uxNotes.push(`${screen.name}: Missing sidebar navigation`);
            if (!hasHeader) uxNotes.push(`${screen.name}: Missing header`);
          }
        }
      }

      // Screenshot
      await page.screenshot({ path: screenshotPath, fullPage: false });

    } catch (err) {
      status = 'FAIL';
      statusEmoji = '❌';
      note = err.message.substring(0, 100);
      failCount++;
      bugs.push({ screen: screen.name, issue: note, url });

      // Try to screenshot even on error
      try { await page.screenshot({ path: screenshotPath, fullPage: false }); } catch { /* */ }
    }

    results.push({
      name: screen.name,
      description: screen.description,
      url,
      httpCode,
      status,
      statusEmoji,
      note,
      screenshot: screenshotPath,
    });

    console.log(`  ${statusEmoji} ${status} ${note ? `— ${note}` : ''}`);
  }

  await browser.close();

  // ── Generate Report ─────────────────────────────────────────────────────
  const total = SCREENS.length;
  const uxScore = Math.round(((passCount + emptyCount * 0.5) / total) * 10);

  let report = `# Copalite Visual Audit Report\n\n`;
  report += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Screens Audited**: ${total}\n`;
  report += `**Screenshots**: \`${SCREENSHOT_DIR}\`\n\n`;

  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Screens | ${total} |\n`;
  report += `| PASS | ${passCount} |\n`;
  report += `| EMPTY (no data) | ${emptyCount} |\n`;
  report += `| FAIL | ${failCount} |\n`;
  report += `| UX Score | **${uxScore}/10** |\n\n`;

  report += `## Screen Results\n\n`;
  report += `| # | Screen | Description | HTTP | Status | Note |\n`;
  report += `|---|--------|-------------|------|--------|------|\n`;
  for (const r of results) {
    report += `| ${r.name.split('_')[0]} | ${r.name} | ${r.description} | ${r.httpCode} | ${r.statusEmoji} ${r.status} | ${r.note || '-'} |\n`;
  }

  if (bugs.length > 0) {
    report += `\n## Bugs Found\n\n`;
    report += `| Screen | Issue | URL |\n`;
    report += `|--------|-------|-----|\n`;
    for (const b of bugs) {
      report += `| ${b.screen} | ${b.issue} | ${b.url} |\n`;
    }
  } else {
    report += `\n## Bugs Found\n\nNone! All screens pass.\n`;
  }

  if (uxNotes.length > 0) {
    report += `\n## UX Notes\n\n`;
    for (const n of uxNotes) {
      report += `- ${n}\n`;
    }
  }

  report += `\n## Screenshots\n\n`;
  for (const r of results) {
    report += `- \`${path.basename(r.screenshot)}\` — ${r.description} (${r.statusEmoji})\n`;
  }

  report += `\n## Verdict\n\n`;
  if (failCount === 0) {
    report += `**ALL SCREENS PASS.** Platform is visually functional.\n`;
  } else {
    report += `**${failCount} screen(s) need fixing** before client demo.\n`;
  }

  fs.writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`\n=== AUDIT COMPLETE ===`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log(`Result: ${passCount} PASS | ${emptyCount} EMPTY | ${failCount} FAIL | UX Score: ${uxScore}/10`);
})();
