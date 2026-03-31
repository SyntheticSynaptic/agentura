"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>Agentura · Open-source eval CI/CD for AI agents</p>
      <div className="footer-links">
        <a href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <Link href="/docs">Docs</Link>
        <a href="https://www.npmjs.com/package/agentura" target="_blank" rel="noreferrer">
          npm
        </a>
        <a href="https://agentura-playground.vercel.app" target="_blank" rel="noreferrer">
          Playground
        </a>
        <a href="https://github.com/SyntheticSynaptic/agentura/blob/main/LICENSE" target="_blank" rel="noreferrer">
          MIT License
        </a>
      </div>

      <style jsx>{`
        .site-footer {
          margin-top: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
          color: var(--muted);
          font-size: 14px;
        }

        .site-footer p {
          margin: 0;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .footer-links a {
          color: var(--muted);
          text-decoration: none;
        }

        .footer-links a:hover {
          color: var(--text);
        }

        @media (max-width: 768px) {
          .site-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
