"use client";

interface ApiKeyRowProps {
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    createdAt: string | Date;
    lastUsedAt: string | Date | null;
    revokedAt?: string | Date | null;
  };
  onRevoke: (id: string) => void;
  isRevoking?: boolean;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "Never";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Never";
  }

  return date.toLocaleString();
}

export function ApiKeyRow({ apiKey, onRevoke, isRevoking = false }: ApiKeyRowProps) {
  const isRevoked = Boolean(apiKey.revokedAt);
  const textClass = isRevoked ? "text-slate-400 line-through" : "text-slate-700";

  return (
    <tr className="border-t border-slate-200">
      <td className={`px-4 py-3 align-middle font-medium ${textClass}`}>{apiKey.name}</td>
      <td className={`px-4 py-3 align-middle font-mono text-xs ${textClass}`}>
        {apiKey.keyPrefix}
      </td>
      <td className={`px-4 py-3 align-middle text-sm ${textClass}`}>
        {formatDate(apiKey.createdAt)}
      </td>
      <td className={`px-4 py-3 align-middle text-sm ${textClass}`}>
        {formatDate(apiKey.lastUsedAt)}
      </td>
      <td className="px-4 py-3 align-middle">
        <button
          type="button"
          disabled={isRevoking || isRevoked}
          onClick={() => onRevoke(apiKey.id)}
          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Revoke
        </button>
      </td>
    </tr>
  );
}
