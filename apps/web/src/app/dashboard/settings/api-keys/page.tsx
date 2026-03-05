"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiKeyRow } from "../../../../components/dashboard/ApiKeyRow";
import { trpc } from "../../../../components/providers";

export default function ApiKeysPage() {
  const utils = trpc.useUtils();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  const listQuery = trpc.apiKeys.list.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: async (result) => {
      setRevealedKey(result.raw);
      setShowCreateForm(false);
      setName("");
      await utils.apiKeys.list.invalidate();
    },
  });

  const revokeMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.list.invalidate();
    },
    onSettled: () => {
      setRevokingKeyId(null);
    },
  });

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || createMutation.isPending) {
      return;
    }

    await createMutation.mutateAsync({ name: trimmed });
  }

  async function handleCopy() {
    if (!revealedKey || isCopying) {
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(revealedKey);
    } finally {
      setIsCopying(false);
    }
  }

  async function handleRevoke(id: string) {
    if (revokeMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("Are you sure? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setRevokingKeyId(id);
    await revokeMutation.mutateAsync({ id });
  }

  const keys = listQuery.data ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Settings
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">API Keys</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use API keys to authenticate the Agentura CLI
          </p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-slate-700 underline">
          Back to dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowCreateForm((value) => !value)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create API Key
        </button>
      </div>

      {showCreateForm ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="api-key-name">
            Key name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder="e.g. local dev"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring sm:max-w-md"
            />
            <button
              type="button"
              disabled={createMutation.isPending || name.trim().length === 0}
              onClick={handleCreate}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? "Generating..." : "Generate"}
            </button>
          </div>
          {createMutation.error ? (
            <p className="mt-2 text-sm text-red-700">{createMutation.error.message}</p>
          ) : null}
        </section>
      ) : null}

      {revealedKey ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            This key will only be shown once. Copy it now.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-xs text-slate-800">
              {revealedKey}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {isCopying ? "Copying..." : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setRevealedKey(null)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {listQuery.isLoading ? (
          <p className="px-4 py-5 text-sm text-slate-600">Loading API keys...</p>
        ) : keys.length === 0 ? (
          <p className="px-4 py-5 text-sm text-slate-600">
            No API keys yet. Create one to use the CLI.
          </p>
        ) : (
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Prefix</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Created</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Last Used</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((apiKey) => (
                <ApiKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  onRevoke={handleRevoke}
                  isRevoking={revokingKeyId === apiKey.id}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
