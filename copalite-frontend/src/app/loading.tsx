export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-coal-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-coal-700 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-coal-400">Loading...</p>
      </div>
    </div>
  );
}
