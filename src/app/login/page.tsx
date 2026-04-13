"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              BRAND DNA // ANALYZER
            </h1>
          </Link>
          <p className="mt-2 text-sm text-white-dim uppercase tracking-wide">Sign in to your account</p>
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
