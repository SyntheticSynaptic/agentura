"use client";

import { useInView } from "./useInView";

const STEPS = [
  {
    number: "01",
    title: "Initialize",
    command: "$ bunx agentura init",
    output: "",
    caption: "Generate agentura.yaml and store a baseline snapshot from your main branch.",
  },
  {
    number: "02",
    title: "Gate every PR",
    command: "$ agentura run --against main",
    output: "↓ behavior  19/26  0.73  -0.14  regression\n→ Merge blocked: behavior suite below threshold",
    caption: "Every pull request is scored against baseline. Regressions block the merge automatically.",
  },
  {
    number: "03",
    title: "Generate audit report",
    command: "$ agentura report",
    output: "Generated audit_2026-03-28.pdf\n  Eval history · Drift log · Policy decisions",
    caption: "Auto-generated audit trail with full provenance. Ready for compliance review.",
  },
];

export function HowItWorksSection() {
  const { ref, hasEntered } = useInView<HTMLDivElement>({ once: true, threshold: 0.2 });

  return (
    <section className="how-section" id="how-it-works">
      <header className="section-head">
        <p className="section-label">THREE STEPS</p>
        <h2 className="display-lg">Set a baseline. Test every change. Ship with evidence.</h2>
      </header>

      <div ref={ref} className="step-grid">
        {STEPS.map((step, index) => (
          <article
            key={step.number}
            className={`step-card ${hasEntered ? "step-card-visible" : ""}`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <span className="step-number" aria-hidden="true">
              {step.number}
            </span>
            <p className="step-name">{step.title}</p>
            <pre className="step-command">
              <code>{step.command}</code>
            </pre>
            {step.output ? (
              <pre className="step-output">
                <code>{step.output}</code>
              </pre>
            ) : null}
            <p className="step-caption">{step.caption}</p>
          </article>
        ))}
      </div>

      <p className="pytests-callout">A GitHub Action runs your tests. Agentura is the tests.</p>

      <p className="drift-note body-md">
        Agentura also monitors behavioral drift over time against a frozen reference snapshot, not just PR-to-PR
        regression.
      </p>

      <div className="quorum-pill">
        <span>agentura quorum — consensus across model families.</span>
        <span>Independent error distributions.</span>
      </div>

      <style jsx>{`
        .how-section {
          margin-top: 92px;
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
          max-width: 820px;
        }

        .step-grid {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .step-card {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          padding: 24px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 240ms ease, transform 240ms ease;
        }

        .step-card-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .step-number {
          position: absolute;
          top: 12px;
          right: 18px;
          font-family: var(--display);
          font-size: 64px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: rgba(148, 163, 184, 0.08);
          pointer-events: none;
        }

        .step-name {
          position: relative;
          margin: 0 0 18px;
          font-family: var(--display);
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
        }

        .step-command,
        .step-output {
          position: relative;
          margin: 0;
          overflow-x: auto;
          border-radius: 12px;
          background: #060b15;
          padding: 14px 16px;
          font-family: var(--mono);
          font-size: 13px;
          line-height: 1.65;
          color: var(--text);
          white-space: pre-wrap;
        }

        .step-output {
          margin-top: 10px;
          color: var(--muted);
        }

        .step-caption {
          position: relative;
          margin: 16px 0 0;
          font-size: 16px;
          line-height: 1.65;
          color: var(--muted);
        }

        .drift-note {
          margin: 22px 0 0;
          max-width: 780px;
        }

        .pytests-callout {
          margin: 32px auto 0;
          max-width: 560px;
          border-left: 3px solid var(--teal);
          padding-left: 20px;
          font-family: var(--body);
          font-size: 18px;
          line-height: 1.65;
          color: var(--muted);
        }

        .quorum-pill {
          margin-top: 18px;
          display: inline-flex;
          flex-wrap: wrap;
          gap: 8px;
          border-radius: 999px;
          border: 1px solid rgba(20, 184, 166, 0.18);
          background: var(--teal-dim);
          padding: 10px 14px;
          color: var(--teal);
          font-size: 14px;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .step-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
