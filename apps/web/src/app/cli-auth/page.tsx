"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "../../components/providers";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function CliAuthPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">("idle");
  const [isPending, startTransition] = useTransition();

  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (result) => {
      setRevealedToken(result.raw);
      setIsFinished(false);
      setCopyState("idle");
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      setIsCheckingSession(false);
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleGenerateToken = () => {
    if (createMutation.isPending || isPending) {
      return;
    }

    startTransition(async () => {
      await createMutation.mutateAsync({ name: "CLI Token" });
    });
  };

  const handleCopy = async () => {
    if (!revealedToken || copyState === "copying") {
      return;
    }

    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(revealedToken);
      setCopyState("copied");
      setRevealedToken(null);
      setIsFinished(true);
    } catch {
      setCopyState("idle");
    }
  };

  const handleDismiss = () => {
    setRevealedToken(null);
    setIsFinished(true);
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <section className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Connect your CLI</h1>
        <p className="mt-2 text-sm text-slate-300">
          Generate a token and paste it in your terminal to finish{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">agentura login</code>.
        </p>

        <button
          type="button"
          onClick={handleGenerateToken}
          disabled={createMutation.isPending || isPending}
          className="mt-6 rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createMutation.isPending || isPending ? "Generating..." : "Generate CLI Token"}
        </button>

        {createMutation.error ? (
          <p className="mt-3 text-sm text-red-300">{createMutation.error.message}</p>
        ) : null}

        {revealedToken ? (
          <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-200">
              Paste this token in your terminal to complete login
            </p>
            <p className="mt-2 text-sm text-amber-100">This key will only be shown once</p>
            <code className="mt-3 block overflow-x-auto rounded-md border border-amber-400/40 bg-slate-950 px-3 py-2 text-xs text-amber-100">
              {revealedToken}
            </code>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-amber-300/60 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/20"
              >
                {copyState === "copying" ? "Copying..." : copyState === "copied" ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {isFinished ? (
          <p className="mt-6 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            You can close this window.
          </p>
        ) : null}
      </section>
    </main>
  );
}
