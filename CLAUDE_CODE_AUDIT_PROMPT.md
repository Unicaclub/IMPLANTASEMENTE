# Copalite Visual Audit — Documentation

## What this does

`copalite-audit.js` is a Playwright-based visual audit script that:

1. Launches a headless Chromium browser
2. Logs into the Copalite platform
3. Navigates to 15 screens
4. Takes a screenshot of each
5. Checks for errors, empty states, and UX issues
6. Generates a Markdown report with results

## Prerequisites

- Node.js 18+
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:3001`
- Admin user: `admin@copalite.io` / `copalite2024`
- At least one project in the database

## Installation

```bash
cd IMPLANTASEMENTE
npm install playwright --no-save
npx playwright install chromium
```

## Usage

```bash
node copalite-audit.js
```

## Output

- **Report**: `%TEMP%\copalite_audit_report.md`
- **Screenshots**: `%TEMP%\copalite_audit_screenshots\`

## Screens Audited

| # | Screen | Auth Required |
|---|--------|--------------|
| 01 | Landing Page | No |
| 02 | Login Page | No |
| 03 | Main Dashboard | Yes |
| 04 | System Health | Yes |
| 05 | Project Overview | Yes |
| 06 | Orchestration | Yes |
| 07 | Backlog | Yes |
| 08 | Tasks | Yes |
| 09 | Sources | Yes |
| 10 | Runs | Yes |
| 11 | Evidence | Yes |
| 12 | Registries | Yes |
| 13 | Agents | Yes |
| 14 | Notifications | Yes |
| 15 | Swagger API Docs | No |

## Status Classification

- **PASS**: Screen loads correctly with expected content
- **EMPTY**: Screen loads but has no data (acceptable without seed data)
- **FAIL**: Screen has errors, crashes, or returns HTTP error codes

## UX Score

Calculated as: `(PASS + EMPTY * 0.5) / TOTAL * 10`

A score of 8+ means the platform is demo-ready.
