import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="border-t border-slate-800 px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
        <p>Agentura © 2026</p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/SyntheticSynaptic/agentura"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-slate-200"
          >
            GitHub
          </a>
          <Link href="/dashboard" className="transition hover:text-slate-200">
            Dashboard
          </Link>
          <Link href="/login" className="transition hover:text-slate-200">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
