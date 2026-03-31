"use client";

const playgroundUrl = "https://agentura-playground.vercel.app";

const PREVIEW_ROWS = [
  { label: "Accuracy", values: "0.94 → 0.71", delta: "-0.23", gate: "BLOCK" },
  { label: "Tone", values: "0.87 → 0.82", delta: "-0.05", gate: "PASS" },
  { label: "Policy", values: "0.92 → 0.78", delta: "-0.14", gate: "BLOCK" },
];

export function PlaygroundCtaSection() {
  return (
    <section className="playground-section" aria-labelledby="playground-cta-heading">
      <div className="playground-inner">
        <div className="playground-copy">
          <p className="section-label">LIVE DEMO</p>
          <h2 id="playground-cta-heading" className="display-md">
            See a regression get caught.
          </h2>
          <p className="body-md">
            Run a baseline vs branch comparison in your browser. No install. No account. Live eval results.
          </p>
          <a className="playground-button" href={playgroundUrl} target="_blank" rel="noreferrer">
            Open Playground →
          </a>
        </div>

        <div className="preview-wrap">
          <article className="preview-card">
            <p className="preview-label">AGENTURA PLAYGROUND · RESULT</p>

            <div className="preview-block">
              <div className="preview-line">Branch change: Model swap (70B → 8B)</div>
            </div>

            <div className="preview-block">
              <div className="preview-line">Suite: golden_dataset</div>
            </div>

            <div className="preview-table" role="table" aria-label="Playground regression preview">
              {PREVIEW_ROWS.map((row) => (
                <div key={row.label} className="preview-row" role="row">
                  <span role="cell">{row.label}</span>
                  <span role="cell">{row.values}</span>
                  <span role="cell">{row.delta}</span>
                  <strong role="cell" className={row.gate === "BLOCK" ? "gate-block" : "gate-pass"}>
                    {row.gate}
                  </strong>
                </div>
              ))}
            </div>

            <div className="blocked-row">
              <span className="pulse-dot" aria-hidden="true" />
              <strong>MERGE BLOCKED</strong>
            </div>

            <div className="preview-actions" aria-hidden="true">
              <span>[ ↗ Share result ]</span>
              <span>[ ↓ Install Agentura ]</span>
            </div>
          </article>

          <p className="preview-caption">
            <a href={playgroundUrl} target="_blank" rel="noreferrer">
              Live results from the playground ↗
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .playground-section {
          width: 100vw;
          margin-top: 92px;
          margin-left: calc(50% - 50vw);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
        }

        .playground-inner {
          margin: 0 auto;
          display: grid;
          max-width: 1240px;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.06fr);
          gap: 28px;
          padding: 80px 24px;
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
          max-width: 520px;
        }

        .playground-copy :global(.body-md) {
          max-width: 520px;
          margin: 18px 0 0;
        }

        .playground-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          margin-top: 22px;
          border-radius: 999px;
          background: var(--blue);
          padding: 0 18px;
          font-family: var(--body);
          font-size: 15px;
          font-weight: 600;
          color: white;
          text-decoration: none;
        }

        .preview-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preview-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          padding: 24px;
          font-family: var(--mono);
          font-size: 13px;
          color: var(--text);
        }

        .preview-label {
          margin: 0;
          color: var(--muted);
          letter-spacing: 0.06em;
        }

        .preview-block {
          margin-top: 18px;
        }

        .preview-line {
          line-height: 1.7;
        }

        .preview-table {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .preview-row {
          display: grid;
          grid-template-columns: minmax(0, 88px) minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 12px;
          line-height: 1.6;
        }

        .gate-block {
          color: var(--red);
        }

        .gate-pass {
          color: var(--green);
        }

        .blocked-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          color: var(--red);
          font-weight: 600;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--red);
          animation: pulse 2s ease-in-out infinite;
        }

        .preview-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 18px;
          color: var(--muted);
        }

        .preview-caption {
          margin: 0;
          font-size: 12px;
          text-align: right;
        }

        .preview-caption a {
          color: var(--muted);
          text-decoration: none;
        }

        .preview-caption a:hover {
          color: var(--text);
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        @media (max-width: 1024px) {
          .playground-inner {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .playground-inner {
            padding-left: 18px;
            padding-right: 18px;
          }

          .playground-button {
            width: 100%;
          }

          .preview-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .preview-caption {
            text-align: left;
          }
        }
      `}</style>
    </section>
  );
}
