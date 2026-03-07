type CodeBlockProps = {
  code: string;
  language?: string;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      {language ? (
        <span className="absolute right-3 top-3 text-xs font-medium uppercase tracking-wider text-slate-500">
          {language}
        </span>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-emerald-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
