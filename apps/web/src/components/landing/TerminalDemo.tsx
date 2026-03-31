"use client";

import { useRef, useState } from "react";

type ScriptLine = {
  delay: number;
  text: string;
  color?: "green" | "amber" | "red";
};

const SCRIPT: ScriptLine[] = [
  { delay: 0, text: "$ agentura run --against main" },
  { delay: 400, text: "Loading suites from agentura.yaml..." },
  { delay: 700, text: "4 suites · 46 eval cases · baseline: main" },
  { delay: 1000, text: "✓ accuracy    34/36  0.94  +0.03", color: "green" },
  { delay: 1300, text: "↓ behavior    19/26  0.73  -0.14  regression", color: "amber" },
  { delay: 1600, text: "✓ latency     p95 1.9s  within SLA", color: "green" },
  { delay: 1900, text: "✓ cost        $0.043/call  within budget", color: "green" },
  { delay: 2300, text: "→ Merge blocked: behavior suite below threshold", color: "red" },
  { delay: 2600, text: "  Inspect failing cases: PR comment #47" },
];

export function TerminalDemo() {
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [running, setRunning] = useState(false);
  const timeoutIds = useRef<number[]>([]);

  const clearScript = () => {
    timeoutIds.current.forEach((id) => window.clearTimeout(id));
    timeoutIds.current = [];
    setRunning(false);
    setLines([]);
  };

  const runScript = () => {
    clearScript();
    setRunning(true);

    SCRIPT.forEach((line, index) => {
      const id = window.setTimeout(() => {
        setLines((current) => [...current, line]);

        if (index === SCRIPT.length - 1) {
          setRunning(false);
        }
      }, line.delay);

      timeoutIds.current.push(id);
    });
  };

  return (
    <section className="demo-section">
      <div className="demo-shell">
        <div className="demo-head">
          <div>
            <p className="demo-label">DEMO</p>
            <h3>See the gate fail before production does.</h3>
          </div>
          <div className="demo-actions">
            <button type="button" onClick={runScript} disabled={running}>
              ▶ Run
            </button>
            <button type="button" onClick={clearScript}>
              Reset
            </button>
          </div>
        </div>

        <div className="terminal-frame" role="log" aria-live="polite">
          {lines.length === 0 ? <p className="placeholder">$ waiting for command…</p> : null}
          {lines.map((line, index) => (
            <div key={`${line.text}-${index}`} className={`terminal-line ${line.color ? `line-${line.color}` : ""}`}>
              {line.text}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .demo-section {
          margin-top: 92px;
        }

        .demo-shell {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          padding: 20px;
        }

        .demo-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
        }

        .demo-label {
          margin: 0 0 10px;
          color: var(--teal);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .demo-head h3 {
          margin: 0;
          font-family: var(--display);
          font-size: 28px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .demo-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .demo-actions button {
          border: 1px solid var(--border);
          border-radius: 999px;
          background: transparent;
          padding: 10px 14px;
          font-family: var(--body);
          font-size: 14px;
          color: var(--text);
        }

        .demo-actions button[disabled] {
          opacity: 0.6;
        }

        .terminal-frame {
          margin-top: 18px;
          overflow-x: auto;
          border-radius: 14px;
          background: #060b15;
          padding: 18px;
          font-family: var(--mono);
          font-size: 13px;
          line-height: 1.8;
          color: var(--text);
          white-space: pre;
        }

        .placeholder {
          margin: 0;
          color: var(--subtle);
        }

        .line-green {
          color: var(--green);
        }

        .line-amber {
          color: var(--amber);
        }

        .line-red {
          color: var(--red);
        }

        @media (max-width: 640px) {
          .demo-head {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
