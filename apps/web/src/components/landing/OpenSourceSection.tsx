"use client";

import Link from "next/link";

const TERMINAL_LINES = [
  "$ bunx agentura init        # generate config + baseline",
  "$ git checkout -b my-branch",
  "$ git push                  # eval checks run automatically on PR",
];

export function OpenSourceSection() {
  return (
    <section id="open-source" className="open-source-section">
      <header className="section-head">
        <p className="section-label">OPEN SOURCE</p>
        <h2 className="display-lg">Free to use. Free to self-host.</h2>
      </header>

      <div className="open-shell">
        <div className="terminal-block">
          {TERMINAL_LINES.map((line) => (
            <div key={line} className="terminal-line">
              {line}
            </div>
          ))}
        </div>

        <div className="open-actions">
          <a href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
            GitHub Repo
          </a>
          <Link href="/docs">Read the Docs</Link>
        </div>

        <p className="caption">MIT License · Self-host in minutes · Own your eval data</p>
      </div>

      <style jsx>{`
        .open-source-section {
          margin-top: 116px;
          padding-bottom: 24px;
        }

        .section-label {
          margin: 0 0 14px;
          color: var(--teal);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
        }

        .open-shell {
          margin-top: 24px;
          max-width: 860px;
        }

        .terminal-block {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: #060b15;
          padding: 20px;
          font-family: var(--mono);
          font-size: 13px;
          line-height: 1.9;
          color: var(--text);
        }

        .open-actions {
          margin-top: 18px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .open-actions a {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0 16px;
          font-family: var(--body);
          font-size: 14px;
          font-weight: 500;
          color: var(--text);
          text-decoration: none;
        }

        .caption {
          margin: 14px 0 0;
          color: var(--muted);
          font-size: 14px;
        }
      `}</style>
    </section>
  );
}
