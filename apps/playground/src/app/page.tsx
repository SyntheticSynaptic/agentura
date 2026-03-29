"use client";

import { PlaygroundInput } from "../components/PlaygroundInput";

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <header className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AGENTURA PLAYGROUND</p>
            <h1>Watch a branch change trip a merge gate before it reaches production.</h1>
            <p className="subhead">
              This is the smallest honest demo of Agentura’s core loop: baseline on main, branch comparison, suite
              scores, and a merge decision you can share.
            </p>
          </div>
          <a className="back-link" href={process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://agentura-ci.vercel.app"}>
            Back to Agentura
          </a>
        </header>

        <PlaygroundInput />
      </div>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          padding: 48px 20px 72px;
        }

        .page-frame {
          margin: 0 auto;
          max-width: 1240px;
        }

        .hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 24px;
        }

        .hero-copy {
          max-width: 780px;
        }

        .eyebrow {
          margin: 0 0 14px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--cyan);
        }

        h1 {
          margin: 0;
          font-family: var(--display);
          font-size: clamp(2.6rem, 6vw, 5rem);
          line-height: 0.98;
          letter-spacing: -0.055em;
        }

        .subhead {
          margin: 18px 0 0;
          max-width: 700px;
          font-size: clamp(1.08rem, 2vw, 1.32rem);
          line-height: 1.65;
          color: var(--muted);
        }

        .back-link {
          flex: none;
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.78);
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
        }

        @media (max-width: 900px) {
          .hero {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
