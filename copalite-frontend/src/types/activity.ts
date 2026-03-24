// ============================================
// Activity History Types — Bloco 7
// ============================================

export interface ActivityHistoryResponse {
  id: string;
  workspaceId: string;
  projectId: string | null;
  userId: string | null;
  agentId: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string | null;
  createdAt: string;
}
