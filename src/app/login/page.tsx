"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_NEXT = "https://brandaudit.aiden.services/dashboard";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black-ink flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-red-hot" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gateway accepts a `next` URL so users land back on the correct page
  // after magic-link sign-in. Fall back to dashboard.
  const nextTarget = searchParams.get("next") || DEFAULT_NEXT;
  const gatewayHref = `https://www.aiden.services/login?next=${encodeURIComponent(nextTarget)}`;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase) { setError("Auth not configured"); return; }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Incorrect email or password"
        : authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-black-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-2xl font-bold text-red-hot uppercase tracking-tight">
              AIDEN BRAND AUDIT
            </h1>
          </Link>
          <p className="mt-2 text-sm text-white-dim uppercase tracking-wide">Sign in to your account</p>
        </div>

        <a
          href={gatewayHref}
          className="flex items-center justify-center gap-2 w-full bg-black-deep border-2 border-red-hot text-red-hot hover:bg-red-hot hover:text-white px-8 py-3 text-sm font-bold uppercase tracking-wide transition-all mb-4"
        >
          Continue with AIDEN
        </a>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-[10px] text-white-dim uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <form onSubmit={handleLogin} className="bg-black-deep border-2 border-border-subtle p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 focus:border-red-hot transition-all"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white-dim uppercase tracking-wide mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 focus:border-red-hot transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 px-4 py-3">
              <p className="text-sm text-red-400 font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-hot text-white px-8 py-3 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>

          <p className="text-center text-sm text-white-dim">
            No account?{" "}
            <Link href="/register" className="text-red-hot hover:text-orange-accent transition-colors font-bold">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
