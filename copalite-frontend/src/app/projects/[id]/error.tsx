"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, ArrowLeft } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { toUserMessage } from "@/lib/errors";

export default function ProjectError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error("Project error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] flex items-center justify-center">
        <div className="card p-10 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-coal-50 mb-2">
            Error loading project
          </h1>
          <p className="text-sm text-coal-400 mb-6">
            {toUserMessage(
              error,
              "Could not load this project page. Please try again.",
            )}
          </p>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={reset} className="btn-primary gap-2">
              <RotateCw size={14} />
              Try again
            </button>
            <a href="/dashboard" className="btn-secondary gap-2">
              <ArrowLeft size={14} />
              Back to dashboard
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
