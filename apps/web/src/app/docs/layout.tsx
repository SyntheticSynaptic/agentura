import Link from "next/link";
import type { ReactNode } from "react";
import { DocsSidebar } from "../../components/docs/DocsSidebar";

type DocsLayoutProps = {
  children: ReactNode;
};

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-3">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <p className="font-semibold text-white">Agentura Docs</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-400 transition hover:text-white">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex h-[calc(100vh-53px)] w-full max-w-7xl">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <DocsSidebar />
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 md:px-10">{children}</main>
      </div>
    </div>
  );
}
