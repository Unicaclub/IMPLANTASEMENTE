// ============================================
// COPALITE API CLIENT
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private token: string | null = null;
  private refreshing: Promise<string | null> | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('copalite_token', token);
    else localStorage.removeItem('copalite_token');
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('copalite_token');
    }
    return this.token;
  }

  private async tryRefresh(): Promise<string | null> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        this.setToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (res.status === 401) {
      // Try refresh once
      if (!this.refreshing) {
        this.refreshing = this.tryRefresh().finally(() => { this.refreshing = null; });
      }
      const newToken = await this.refreshing;

      if (newToken) {
        // Retry with new token
        const retryRes = await fetch(`${API_URL}${path}`, {
          method,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });
        if (retryRes.ok) return retryRes.json();
      }

      // Refresh failed — redirect to login
      this.setToken(null);
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  get<T>(path: string) { return this.request<T>('GET', path); }
  post<T>(path: string, body: any) { return this.request<T>('POST', path, body); }
  patch<T>(path: string, body: any) { return this.request<T>('PATCH', path, body); }
  delete<T>(path: string) { return this.request<T>('DELETE', path); }

  // === AUTH ===
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  }

  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    this.setToken(null);
  }

  getMe() { return this.get<any>('/auth/me'); }

  // === USERS ===
  createUser(data: any) { return this.post<any>('/users', data); }

  // === WORKSPACES ===
  listWorkspaces() { return this.get<any[]>('/workspaces'); }
  createWorkspace(data: any) { return this.post<any>('/workspaces', data); }
  getWorkspace(id: string) { return this.get<any>(`/workspaces/${id}`); }
  listMembers(workspaceId: string) { return this.get<any[]>(`/workspaces/${workspaceId}/members`); }

  // === PROJECTS ===
  listProjects(workspaceId: string) { return this.get<any[]>(`/projects?workspaceId=${workspaceId}`); }
  createProject(data: any) { return this.post<any>('/projects', data); }
  getProject(id: string) { return this.get<any>(`/projects/${id}`); }

  // === SOURCES ===
  listSources(projectId: string) { return this.get<any[]>(`/sources?projectId=${projectId}`); }
  createSource(data: any) { return this.post<any>('/sources', data); }

  // === RUNS ===
  listRuns(projectId: string) { return this.get<any[]>(`/runs?projectId=${projectId}`); }
  getRun(id: string) { return this.get<any>(`/runs/${id}`); }
  getRunSteps(runId: string) { return this.get<any[]>(`/runs/${runId}/steps`); }

  // === AGENTS ===
  listAgents() { return this.get<any[]>('/agents'); }

  // === ORCHESTRATION ===
  startPipeline(data: any) { return this.post<any>('/orchestration/start', data); }
  advanceStep(runId: string, data: any) { return this.patch<any>(`/orchestration/${runId}/advance`, data); }
  getPipelineStatus(runId: string) { return this.get<any>(`/orchestration/${runId}/status`); }
  cancelPipeline(runId: string) { return this.patch<any>(`/orchestration/${runId}/cancel`, {}); }
  retryPipeline(runId: string) { return this.patch<any>(`/orchestration/${runId}/retry`, {}); }
  getAvailablePipelines() { return this.get<any>('/orchestration/pipelines'); }

  // === REGISTRIES ===
  listModules(projectId: string) { return this.get<any[]>(`/modules-registry?projectId=${projectId}`); }
  listRoutes(projectId: string) { return this.get<any[]>(`/route-registry?projectId=${projectId}`); }
  listApis(projectId: string) { return this.get<any[]>(`/api-registry?projectId=${projectId}`); }
  listSchemas(projectId: string) { return this.get<any[]>(`/schema-registry?projectId=${projectId}`); }
  listUiScreens(projectId: string) { return this.get<any[]>(`/ui-registry?projectId=${projectId}`); }

  // === EVIDENCE ===
  listEvidence(projectId: string) { return this.get<any[]>(`/evidence-registry?projectId=${projectId}`); }

  // === BACKLOG ===
  listBacklog(projectId: string) { return this.get<any[]>(`/backlog?projectId=${projectId}`); }
  approveBacklog(id: string, approved: boolean) { return this.patch<any>(`/backlog/${id}/approve`, { approvedForTask: approved }); }

  // === TASKS ===
  listTasks(projectId: string) { return this.get<any[]>(`/tasks?projectId=${projectId}`); }
  createTaskFromBacklog(backlogItemId: string) { return this.post<any>('/tasks/from-backlog', { backlogItemId }); }

  // === DASHBOARD ===
  getProjectDashboard(projectId: string) { return this.get<any>(`/dashboard/project/${projectId}`); }
}

export const api = new ApiClient();
