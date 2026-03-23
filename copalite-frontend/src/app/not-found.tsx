import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-coal-950">
      <div className="text-center">
        <p className="text-7xl font-bold text-emerald-500/20">404</p>
        <h1 className="text-2xl font-bold text-coal-100 mt-4">Page not found</h1>
        <p className="text-coal-400 mt-2 max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn-primary mt-8 inline-flex gap-2">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
