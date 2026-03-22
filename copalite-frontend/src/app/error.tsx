"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { toUserMessage } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-coal-950">
      <div className="card p-10 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-coal-50 mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-coal-400 mb-6">
          {toUserMessage(
            error,
            "An unexpected error occurred. Please try again.",
          )}
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={reset} className="btn-primary gap-2">
            <RotateCw size={14} />
            Try again
          </button>
          <a href="/dashboard" className="btn-secondary gap-2">
            <Home size={14} />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
