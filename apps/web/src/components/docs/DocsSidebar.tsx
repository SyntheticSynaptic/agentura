"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "Getting Started",
    links: [
      { label: "Quick Start", href: "/docs" },
    ],
  },
  {
    label: "Reference",
    links: [
      { label: "agentura.yaml", href: "/docs/configuration" },
      { label: "Eval Strategies", href: "/docs/strategies" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 h-full overflow-y-auto border-r border-slate-800 px-4 py-8">
      {sections.map((section, index) => (
        <div key={section.label} className={index === 0 ? "" : "mt-6"}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            {section.label}
          </p>
          <nav>
            {section.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-1 text-sm transition ${
                    isActive ? "font-medium text-violet-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">More</p>
        <a
          href="https://github.com/SyntheticSynaptic/agentura"
          target="_blank"
          rel="noreferrer"
          className="block py-1 text-sm text-slate-400 transition hover:text-white"
        >
          GitHub
        </a>
        <Link href="/dashboard" className="block py-1 text-sm text-slate-400 transition hover:text-white">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
