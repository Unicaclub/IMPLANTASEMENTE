export class AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    options?: { status?: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.status = options?.status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export function toUserMessage(
  error: unknown,
  fallback = "Request failed",
): string {
  if (error instanceof AppError) {
    if (error.status === 401)
      return "Sua sessao expirou. Faca login novamente.";
    if (error.status === 403) return "Voce nao tem permissao para esta acao.";
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
