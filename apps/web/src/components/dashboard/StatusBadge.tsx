interface StatusBadgeProps {
  status: string;
  passed?: boolean | null;
}

export function StatusBadge({ status, passed }: StatusBadgeProps) {
  if (status === "running") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        Running...
      </span>
    );
  }

  if (status === "completed" && passed === true) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
        Passed
      </span>
    );
  }

  if (status === "completed" && passed === false) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
        Failed
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
        Error
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      Unknown
    </span>
  );
}
