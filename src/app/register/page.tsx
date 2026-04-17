"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_NEXT = "https://brandaudit.aiden.services/dashboard";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black-ink flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-red-hot" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Funnel new signups through the Gateway so they get one AIDEN account
  // that works across every AIDEN product. Local email/password signup
  // remains available for parity with existing users.
  const nextTarget = searchParams.get("next") || DEFAULT_NEXT;
  const gatewayHref = `https://www.aiden.services/login?next=${encodeURIComponent(nextTarget)}`;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) { toast.error("Auth not configured"); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Check your email for a confirmation link");
      router.push("/login");
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
          <p className="mt-2 text-sm text-white-dim uppercase tracking-wide">Create your account</p>
        </div>

        <a
          href={gatewayHref}
          className="flex items-center justify-center gap-2 w-full bg-black-deep border-2 border-red-hot text-red-hot hover:bg-red-hot hover:text-white px-8 py-3 text-sm font-bold uppercase tracking-wide transition-all mb-4"
        >
          Sign up with AIDEN
        </a>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-[10px] text-white-dim uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <form onSubmit={handleRegister} className="bg-black-deep border-2 border-border-subtle p-8 space-y-6">
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
              minLength={6}
              className="w-full bg-black-card border border-border-subtle text-white-full px-4 py-3 text-sm placeholder:text-white-dim/50 focus:border-red-hot transition-all"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-hot text-white px-8 py-3 text-sm font-bold uppercase tracking-wide border-2 border-red-hot hover:bg-red-dim transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>

          <p className="text-center text-sm text-white-dim">
            Already have an account?{" "}
            <Link href="/login" className="text-red-hot hover:text-orange-accent transition-colors font-bold">
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-center text-xs text-white-dim mt-6 uppercase tracking-wide">
          Free plan includes 2 audits per month
        </p>
      </div>
    </div>
  );
}
