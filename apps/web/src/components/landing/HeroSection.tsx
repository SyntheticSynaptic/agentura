"use client";

import { PrGateWidget } from "./PrGateWidget";

const playgroundUrl = "https://agentura-playground.vercel.app";
const githubUrl = "https://github.com/SyntheticSynaptic/agentura";

const STATS = [
  { value: "< 10 min", label: "setup" },
  { value: "0", label: "code changes" },
  { value: "3", label: "eval strategies" },
  { value: "MIT", label: "license" },
];

export function HeroSection() {
  return (
    <section className="hero-shell" id="top">
      <div className="hero-copy">
        <h1 className="display-xl">
          Make sure your AI agent still works
          <br />
          after every change.
        </h1>
        <p className="body-lg hero-subhead">Agentura tests your agent on every pull request and tells you what broke before you merge.</p>

        <p className="hero-tagline">Like pytest, but for AI agents.</p>

        <div className="hero-actions">
          <a className="primary-button" href={playgroundUrl} target="_blank" rel="noreferrer">
            Try the Playground →
          </a>
          <a className="secondary-button" href={githubUrl} target="_blank" rel="noreferrer">
            View on GitHub
          </a>
        </div>

        <div className="hero-tech-strip mono" aria-label="Core product coverage">
          <p>Catch regressions in accuracy, safety, cost, and guardrails</p>
          <p>Track drift over time · Keep a full audit trail</p>
        </div>

        <div className="hero-stats mono" aria-label="Key product facts">
          {STATS.map((item, index) => (
            <div key={item.label} className="stat-item">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              {index < STATS.length - 1 ? <i aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="hero-visual">
        <PrGateWidget />
      </div>

      <style jsx>{`
        .hero-shell {
          padding-top: 120px;
          text-align: center;
        }

        .hero-copy {
          max-width: 860px;
          margin: 0 auto;
          opacity: 0;
          animation: heroFade 400ms ease-out forwards;
        }

        h1 {
          margin: 0;
          color: var(--text);
        }

        .hero-subhead {
          max-width: 560px;
          margin: 20px auto 0;
        }

        .hero-tagline {
          margin: 18px 0 0;
          color: var(--teal);
          font-family: var(--body);
          font-size: 15px;
          font-weight: 500;
        }

        .hero-actions {
          margin-top: 18px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border-radius: 999px;
          padding: 0 18px;
          font-family: var(--body);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .primary-button {
          border: 1px solid rgba(59, 130, 246, 0.2);
          background: var(--blue);
          color: white;
        }

        .secondary-button {
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text);
        }

        .primary-button:hover,
        .secondary-button:hover {
          transform: translateY(-1px);
        }

        .hero-tech-strip {
          margin: 16px auto 0;
          padding: 16px 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.8;
          text-align: center;
        }

        .hero-tech-strip p {
          margin: 0;
        }

        .hero-stats {
          margin: 6px auto 0;
          display: flex;
          width: fit-content;
          max-width: 100%;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
          color: var(--muted);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          letter-spacing: 0.01em;
        }

        .stat-item strong {
          color: var(--text);
          font-weight: 500;
        }

        .stat-item i {
          display: inline-block;
          width: 1px;
          height: 12px;
          margin-left: 6px;
          background: var(--border);
        }

        .hero-visual {
          max-width: 840px;
          margin: 36px auto 0;
        }

        @keyframes heroFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .hero-shell {
            padding-top: 92px;
          }

          .hero-stats {
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }

          .hero-tech-strip {
            padding-top: 14px;
            padding-bottom: 14px;
          }

          .stat-item i {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
