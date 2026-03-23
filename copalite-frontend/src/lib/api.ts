// ============================================
// COPALITE API CLIENT
// ============================================

import { AppError } from "./errors";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

class ApiClient {
  private token: string | null = null;
  private tokenExpiresAt: number | null = null;
  private refreshing: Promise<string | null> | null = null;

  private readonly tokenStorageKey = "copalite_token";
  private readonly tokenExpStorageKey = "copalite_token_exp";

  private getStorage(): Storage | null {
    return globalThis.localStorage ?? null;
  }

  setToken(token: string | null) {
    this.token = token;
    const storage = this.getStorage();
    if (!storage) return;

    if (token) {
      storage.setItem(this.tokenStorageKey, token);
      if (!this.tokenExpiresAt) {
        this.tokenExpiresAt = this.extractTokenExp(token);
      }
      if (this.tokenExpiresAt) {
        storage.setItem(this.tokenExpStorageKey, String(this.tokenExpiresAt));
      }
    } else {
      this.tokenExpiresAt = null;
      storage.removeItem(this.tokenStorageKey);
      storage.removeItem(this.tokenExpStorageKey);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    const storage = this.getStorage();
    if (!storage) return this.token;

    this.token = storage.getItem(this.tokenStorageKey);
    const storedExp = storage.getItem(this.tokenExpStorageKey);
    this.tokenExpiresAt = storedExp
      ? Number(storedExp)
      : this.extractTokenExp(this.token);
    return this.token;
  }

  private setTokenExpiration(isoOrNull?: string | null) {
    if (isoOrNull) {
      const ts = Date.parse(isoOrNull);
      this.tokenExpiresAt = Number.isNaN(ts) ? null : ts;
    }

    const storage = this.getStorage();
    if (storage) {
      if (this.tokenExpiresAt) {
        storage.setItem(this.tokenExpStorageKey, String(this.tokenExpiresAt));
      } else {
        storage.removeItem(this.tokenExpStorageKey);
      }
    }
  }

  private extractTokenExp(token: string | null): number | null {
    if (!token) return null;

    try {
      const payload = token.split(".")[1];
      if (!payload) return null;
      const parsed = JSON.parse(globalThis.atob(payload));
      return parsed?.exp ? parsed.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private async ensureSession() {
    const token = this.getToken();
    if (!token || !this.tokenExpiresAt) return;

    const now = Date.now();
    const needsRefresh = this.tokenExpiresAt - now < 30_000;
    if (!needsRefresh) return;

    await this.getRefreshPromise();
  }

  private parseErrorPayload(payload: any, status: number): AppError {
    if (payload?.message && Array.isArray(payload.message)) {
      return new AppError(payload.message.join(", "), {
        status,
        code: payload.error,
        details: payload,
      });
    }

    return new AppError(payload?.message || `HTTP ${status}`, {
      status,
      code: payload?.error,
      details: payload,
    });
  }

  private parseListResponse<T>(payload: any): T[] {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  private getRefreshPromise(): Promise<string | null> {
    this.refreshing ??= this.tryRefresh().finally(() => {
      this.refreshing = null;
    });

    return this.refreshing;
  }

  private async tryRefresh(): Promise<string | null> {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        this.setTokenExpiration(data.accessTokenExpiresAt || null);
        this.setToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async handleUnauthorized<T>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    const newToken = await this.getRefreshPromise();

    if (!newToken) {
      this.setToken(null);
      if (globalThis.location) globalThis.location.href = "/auth/login";
      throw new AppError("Unauthorized", { status: 401 });
    }

    const retryRes = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      cache: "no-store",
    });

    if (retryRes.ok) {
      return retryRes.json();
    }

    const retryErr = await retryRes
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw this.parseErrorPayload(retryErr, retryRes.status);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
  ): Promise<T> {
    await this.ensureSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 401) {
      return this.handleUnauthorized<T>(method, path, body);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw this.parseErrorPayload(err, res.status);
    }

    return res.json();
  }

  get<T>(path: string) {
    return this.request<T>("GET", path);
  }
  post<T>(path: string, body: any) {
    return this.request<T>("POST", path, body);
  }
  patch<T>(path: string, body: any) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  // === AUTH ===
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw this.parseErrorPayload(err, res.status);
    }
    const data = await res.json();
    this.setTokenExpiration(data.accessTokenExpiresAt || null);
    return data;
  }

  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      /* ignore */
    }
    this.setToken(null);
  }

  getMe() {
    return this.get<any>("/auth/me");
  }

  // === USERS ===
  createUser(data: any) {
    return this.post<any>("/users", data);
  }

  // === WORKSPACES ===
  listWorkspaces() {
    return this.get<any[]>("/workspaces");
  }
  createWorkspace(data: any) {
    return this.post<any>("/workspaces", data);
  }
  getWorkspace(id: string) {
    return this.get<any>(`/workspaces/${id}`);
  }
  listMembers(workspaceId: string) {
    return this.get<any[]>(`/workspaces/${workspaceId}/members`);
  }

  // === PROJECTS ===
  async listProjects(workspaceId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/projects?workspaceId=${workspaceId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  createProject(data: any) {
    return this.post<any>("/projects", data);
  }
  getProject(id: string) {
    return this.get<any>(`/projects/${id}`);
  }

  // === SOURCES ===
  async listSources(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/sources?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  createSource(data: any) {
    return this.post<any>("/sources", data);
  }

  // === RUNS ===
  async listRuns(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/runs?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  getRun(id: string) {
    return this.get<any>(`/runs/${id}`);
  }
  getRunSteps(runId: string) {
    return this.get<any[]>(`/runs/${runId}/steps`);
  }

  // === AGENTS ===
  listAgents() {
    return this.get<any[]>("/agents");
  }

  // === ORCHESTRATION ===
  startPipeline(data: any) {
    return this.post<any>("/orchestration/start", data);
  }
  advanceStep(runId: string, data: any) {
    return this.patch<any>(`/orchestration/${runId}/advance`, data);
  }
  getPipelineStatus(runId: string) {
    return this.get<any>(`/orchestration/${runId}/status`);
  }
  cancelPipeline(runId: string) {
    return this.patch<any>(`/orchestration/${runId}/cancel`, {});
  }
  retryPipeline(runId: string) {
    return this.patch<any>(`/orchestration/${runId}/retry`, {});
  }
  getAvailablePipelines() {
    return this.get<any>("/orchestration/pipelines");
  }

  // === REGISTRIES ===
  async listModules(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/modules-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  async listRoutes(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/route-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  async listApis(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/api-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  async listSchemas(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/schema-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  async listUiScreens(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/ui-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }

  // === EVIDENCE ===
  async listEvidence(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/evidence-registry?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }

  // === BACKLOG ===
  async listBacklog(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/backlog?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  approveBacklog(id: string, approved: boolean) {
    return this.patch<any>(`/backlog/${id}/approve`, {
      approvedForTask: approved,
    });
  }

  // === TASKS ===
  async listTasks(projectId: string, page = 1, limit = 20) {
    const payload = await this.get<any>(
      `/tasks?projectId=${projectId}&page=${page}&limit=${limit}`,
    );
    return this.parseListResponse<any>(payload);
  }
  createTaskFromBacklog(backlogItemId: string) {
    return this.post<any>("/tasks/from-backlog", { backlogItemId });
  }

  // === DASHBOARD ===
  getProjectDashboard(projectId: string) {
    return this.get<any>(`/dashboard/project/${projectId}`);
  }

  // === NOTIFICATIONS ===
  listNotifications(workspaceId: string) {
    return this.get<any[]>(`/notifications?workspaceId=${workspaceId}`);
  }
  markNotificationRead(id: string) {
    return this.patch<any>(`/notifications/${id}/read`, {});
  }

  // === SYSTEM HEALTH ===
  getSystemHealth() {
    return this.get<any>('/system-health/live');
  }
}

export const api = new ApiClient();
