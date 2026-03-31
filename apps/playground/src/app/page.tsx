"use client";

import { PlaygroundInput } from "../components/PlaygroundInput";

export default function HomePage() {
  const mainSiteUrl = "https://agentura-ci.vercel.app";
  const githubUrl = "https://github.com/SyntheticSynaptic/agentura";

  return (
    <>
      <nav className="site-nav">
        <a className="brand" href={mainSiteUrl}>
          Agentura
        </a>
        <a className="nav-link" href={githubUrl} target="_blank" rel="noreferrer">
          GitHub
        </a>
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
          .site-nav {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            padding: 16px 32px;
            border-bottom: 1px solid var(--border);
            background: var(--bg);
          }

          .brand {
            color: var(--text);
            font-family: var(--display);
            font-size: 16px;
            font-weight: 700;
            text-decoration: none;
          }

          .nav-link {
            color: var(--muted);
            font-family: var(--body);
            font-size: 14px;
            text-decoration: none;
            margin-left: auto;
            white-space: nowrap;
          }

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

          @media (max-width: 720px) {
            .site-nav {
              padding: 16px 24px;
            }
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
