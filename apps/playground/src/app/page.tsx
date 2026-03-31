"use client";

import { PlaygroundInput } from "../components/PlaygroundInput";

export default function HomePage() {
  return (
    <>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 32px",
          height: "56px",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          backgroundColor: "#080d1a",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <a
          href="https://agentura.run"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: "16px",
            color: "#f1f5f9",
            textDecoration: "none",
          }}
        >
          agentura
        </a>
        <div />
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="https://github.com/SyntheticSynaptic/agentura"
            target="_blank"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            GitHub
          </a>
          <a
            href="https://agentura.run/docs"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#94a3b8",
              textDecoration: "none",
            }}
          >
            Docs
          </a>
        </div>
      </nav>

      <main className="page-shell">
        <div className="page-frame">
          <header className="hero">
            <h1>
              Run a live eval.
              <br />
              See what breaks before merge.
            </h1>
            <p className="subhead">Pick a scenario, run the comparison, share the result.</p>
          </header>

          <PlaygroundInput />
        </div>

        <style jsx>{`
          .page-shell {
            min-height: 100vh;
            padding: 0 24px 72px;
          }

          .page-frame {
            margin: 0 auto;
            max-width: 1100px;
          }

          .hero {
            padding-top: 0;
          }

          h1 {
            margin: 48px auto 8px;
            color: var(--text);
            font-family: var(--display);
            font-size: clamp(32px, 5vw, 52px);
            font-weight: 700;
            line-height: 1.1;
            text-align: center;
            letter-spacing: -0.05em;
          }

          .subhead {
            margin: 0 auto 40px;
            max-width: 420px;
            color: var(--muted);
            font-family: var(--body);
            font-size: 18px;
            line-height: 1.6;
            text-align: center;
            white-space: nowrap;
          }

          @media (max-width: 480px) {
            .subhead {
              white-space: normal;
            }
          }
        `}</style>
      </main>
    </>
  );
}
