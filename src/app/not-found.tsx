import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black-ink flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[120px] font-bold text-red-hot leading-none tracking-tighter">
          404
        </p>
        <h1 className="text-xl font-bold text-white uppercase tracking-wide mt-4">
          Page Not Found
        </h1>
        <p className="text-sm text-white-dim mt-3">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href="/"
            className="bg-red-hot text-white px-6 py-3 text-xs font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="bg-black-card text-white-muted px-6 py-3 text-xs font-bold uppercase tracking-wide border-2 border-border-subtle hover:border-orange-accent transition-all"
          >
            Dashboard
          </Link>
        </div>
        <p className="text-[10px] text-white-dim uppercase tracking-widest mt-12">
          Brand DNA // Analyzer
        </p>
      </div>
    </div>
  );
}
