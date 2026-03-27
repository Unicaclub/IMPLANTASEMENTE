/**
 * Integration test: Pipeline orchestration against RUNNING backend
 *
 * Requires: Backend running on http://localhost:3000 (or via nginx on :80)
 * Run: npx jest --testPathPattern=integration/pipeline
 */

export {}; // make this a module

const BASE = process.env.TEST_API_URL || 'http://localhost/api/v1';

async function api(method: string, path: string, token: string, body?: any) {
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${BASE}${path}`, opts);
}

describe('Pipeline Flow (integration)', () => {
  let accessToken: string;
  let workspaceId: string;
  let projectId: string;
  const suffix = Date.now();

  beforeAll(async () => {
    // Register user
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `pipe-${suffix}@test.io`,
        password: 'PipelineTest2024',
        fullName: 'Pipeline Tester',
      }),
    });
    const regBody = await regRes.json();
    accessToken = regBody.accessToken;

    // Create workspace
    const wsRes = await api('POST', '/workspaces', accessToken, {
      name: `WS ${suffix}`,
      slug: `ws-${suffix}`,
    });
    const wsBody = await wsRes.json();
    workspaceId = wsBody.id;

    // Create project
    const projRes = await api('POST', '/projects', accessToken, {
      name: `Project ${suffix}`,
      slug: `proj-${suffix}`,
      workspaceId,
      projectType: 'web_application',
    });
    const projBody = await projRes.json();
    projectId = projBody.id;
  }, 30000);

  it('GET /orchestration/pipelines — returns all pipeline definitions', async () => {
    const res = await api('GET', '/orchestration/pipelines', accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.discovery).toBeDefined();
    expect(body.discovery.totalSteps).toBeGreaterThan(0);
    expect(body.comparison).toBeDefined();
    expect(body.audit).toBeDefined();
    expect(body.backlog_generation).toBeDefined();
  });

  it('POST /orchestration/start (dry run) — creates run + steps', async () => {
    const res = await api('POST', '/orchestration/start', accessToken, {
      projectId,
      runType: 'discovery',
      title: 'Dry Run Test',
      goal: 'Test creation',
      dryRun: true,
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.run.status).toBe('pending');
    expect(body.run.projectId).toBe(projectId);
    expect(body.steps).toHaveLength(8);
    expect(body.firstAgentRun).toBeNull();

    for (let i = 0; i < body.steps.length; i++) {
      expect(body.steps[i].stepOrder).toBe(i + 1);
      expect(body.steps[i].status).toBe('pending');
    }
  });

  it('POST /orchestration/start (real) — fails gracefully without LLM', async () => {
    const res = await api('POST', '/orchestration/start', accessToken, {
      projectId,
      runType: 'discovery',
      title: 'No LLM Test',
      goal: 'Test fail-fast',
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.run.status).toBe('failed');
    expect(body.firstAgentRun).toBeDefined();
    expect(body.firstAgentRun.status).toBe('failed');
    expect(body.firstAgentRun.outputSummary).toContain('No LLM provider configured');
  });

  it('GET /orchestration/:runId/status — returns progress', async () => {
    // Create dry run
    const createRes = await api('POST', '/orchestration/start', accessToken, {
      projectId,
      runType: 'audit',
      title: 'Status Test',
      goal: 'Check status',
      dryRun: true,
    });
    const createBody = await createRes.json();

    const res = await api('GET', `/orchestration/${createBody.run.id}/status`, accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.run.id).toBe(createBody.run.id);
    expect(body.steps).toHaveLength(5);
    expect(body.progress.total).toBe(5);
    expect(body.progress.completed).toBe(0);
  });

  it('PATCH /orchestration/:runId/cancel — cancels pending run', async () => {
    const createRes = await api('POST', '/orchestration/start', accessToken, {
      projectId,
      runType: 'comparison',
      title: 'Cancel Test',
      goal: 'Test cancel',
      dryRun: true,
    });
    const createBody = await createRes.json();

    const res = await api('PATCH', `/orchestration/${createBody.run.id}/cancel`, accessToken, {});
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('cancelled');
    expect(body.finishedAt).toBeDefined();
  });

  it('GET /runs?projectId= — lists runs with pagination', async () => {
    const res = await api('GET', `/runs?projectId=${projectId}&page=1&limit=10`, accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(4);
    expect(body.meta.total).toBeGreaterThanOrEqual(4);
  });

  it('GET /runs/:id/steps — returns steps with agent data', async () => {
    // Find a run with steps
    const runsRes = await api('GET', `/runs?projectId=${projectId}`, accessToken);
    const runsBody = await runsRes.json();
    const run = runsBody.data[0];

    const res = await api('GET', `/runs/${run.id}/steps`, accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].stepOrder).toBe(1);
  });

  it('GET /agents — returns seeded agents', async () => {
    const res = await api('GET', '/agents', accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.length).toBe(9);
    const types = body.map((a: any) => a.agentType);
    expect(types).toContain('orchestrator');
    expect(types).toContain('architect');
    expect(types).toContain('schema_mapper');
  });

  it('GET /dashboard/project/:id — returns aggregated data', async () => {
    const res = await api('GET', `/dashboard/project/${projectId}`, accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.project.id).toBe(projectId);
    expect(body.runs.total).toBeGreaterThanOrEqual(4);
  });

  it('GET /notifications — captured pipeline events', async () => {
    const res = await api('GET', `/notifications?workspaceId=${workspaceId}`, accessToken);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it('Registries return 200 with empty data', async () => {
    const endpoints = [
      `/modules-registry?projectId=${projectId}`,
      `/api-registry?projectId=${projectId}`,
      `/schema-registry?projectId=${projectId}`,
      `/ui-registry?projectId=${projectId}`,
      `/evidence-registry?projectId=${projectId}`,
      `/backlog?projectId=${projectId}`,
      `/tasks?projectId=${projectId}`,
      `/targets?projectId=${projectId}`,
      `/browser-runs?projectId=${projectId}`,
    ];

    for (const endpoint of endpoints) {
      const res = await api('GET', endpoint, accessToken);
      expect(res.status).toBe(200);
    }
  });
});
