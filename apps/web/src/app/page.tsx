"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type SuiteState = "running" | "pass" | "fail";

type SuiteRow = {
  name: string;
  state: SuiteState;
  score: string;
  delta: string;
};

type StoryKey = "prompt" | "model" | "context";

type StoryCase = {
  key: StoryKey;
  label: string;
  title: string;
  scenario: string;
  caught: string;
  scoreShift: number;
  latencyShift: number;
  rows: Array<{
    metric: string;
    baseline: string;
    branch: string;
    delta: string;
    gate: string;
  }>;
};

type MatrixKey = "agentura" | "diy" | "locked";

type MatrixOption = {
  key: MatrixKey;
  label: string;
  summary: string;
  rows: Array<{
    capability: string;
    verdict: string;
  }>;
};

type TerminalLine = {
  kind: "cmd" | "info" | "pass" | "warn" | "accent";
  text: string;
  delayMs?: number;
};

const FINAL_ROWS: SuiteRow[] = [
  { name: "accuracy / golden_dataset", state: "pass", score: "0.98", delta: "+0.01" },
  { name: "behavior / llm_judge", state: "fail", score: "0.73", delta: "-0.14" },
  { name: "latency / performance", state: "pass", score: "0.95", delta: "+0.02" },
  { name: "cost / budget_guard", state: "pass", score: "0.92", delta: "+0.04" },
];

const STORY_CASES: StoryCase[] = [
  {
    key: "prompt",
    label: "Prompt Drift",
    title: "A friendlier tone silently increased refund approvals by 40%.",
    scenario:
      "The prompt sounded warmer, but edge-case policy logic shifted. QA passed happy paths while refund guardrails regressed.",
    caught:
      "Agentura compared branch outputs to baseline and blocked merge when golden_dataset + llm_judge dropped below threshold.",
    scoreShift: -0.26,
    latencyShift: 0.08,
    rows: [
      { metric: "Accuracy score", baseline: "0.91", branch: "0.67", delta: "-0.24", gate: "BLOCK" },
      { metric: "Policy fidelity", baseline: "0.88", branch: "0.64", delta: "-0.24", gate: "BLOCK" },
      { metric: "Median latency", baseline: "842ms", branch: "902ms", delta: "+60ms", gate: "PASS" },
    ],
  },
  {
    key: "model",
    label: "Model Swap",
    title: "Cheaper model kept speed high but dropped legal-quality reliability.",
    scenario:
      "Spot checks looked fine. Long legal summaries omitted liability language under heavier context windows.",
    caught:
      "The llm_judge suite flagged reasoning regressions, while exact-match and semantic checks isolated impacted cases.",
    scoreShift: -0.19,
    latencyShift: -0.05,
    rows: [
      { metric: "Judge score", baseline: "0.89", branch: "0.70", delta: "-0.19", gate: "BLOCK" },
      { metric: "Clause recall", baseline: "0.86", branch: "0.69", delta: "-0.17", gate: "BLOCK" },
      { metric: "P95 latency", baseline: "2.1s", branch: "1.9s", delta: "-0.2s", gate: "PASS" },
    ],
  },
  {
    key: "context",
    label: "Context Leak",
    title: "A new personalization field changed tone for enterprise customers.",
    scenario:
      "Shipping a personalization feature introduced casual style drift in enterprise support responses.",
    caught:
      "Baseline diff surfaced consistent tone regression in 12 critical evals before release, with clear PR annotation links.",
    scoreShift: -0.17,
    latencyShift: 0.03,
    rows: [
      { metric: "Tone alignment", baseline: "0.90", branch: "0.73", delta: "-0.17", gate: "BLOCK" },
      { metric: "Escalation quality", baseline: "0.84", branch: "0.72", delta: "-0.12", gate: "BLOCK" },
      { metric: "Token cost", baseline: "$0.041", branch: "$0.043", delta: "+$0.002", gate: "PASS" },
    ],
  },
];

const MATRIX_OPTIONS: MatrixOption[] = [
  {
    key: "agentura",
    label: "Agentura",
    summary: "One config. Baseline-aware checks. PR-native reliability signals.",
    rows: [
      { capability: "Baseline diffs per suite", verdict: "Automatic" },
      { capability: "LLM judge + performance + golden", verdict: "Unified" },
      { capability: "PR comments + Check Run", verdict: "Built-in" },
      { capability: "Adoption curve", verdict: "Minutes" },
    ],
  },
  {
    key: "diy",
    label: "DIY Scripts",
    summary: "Flexible but fragile. Maintenance grows faster than signal quality.",
    rows: [
      { capability: "Baseline diffs per suite", verdict: "Manual DB + workers" },
      { capability: "LLM judge + performance + golden", verdict: "Separate pipelines" },
      { capability: "PR comments + Check Run", verdict: "Custom glue" },
      { capability: "Adoption curve", verdict: "Weeks" },
    ],
  },
  {
    key: "locked",
    label: "Framework-locked Tools",
    summary: "Fast start, but migration risk and platform lock-in increase over time.",
    rows: [
      { capability: "Baseline diffs per suite", verdict: "Depends on provider" },
      { capability: "LLM judge + performance + golden", verdict: "Partial" },
      { capability: "PR comments + Check Run", verdict: "Sometimes" },
      { capability: "Adoption curve", verdict: "Easy start, harder scale" },
    ],
  },
];

const RUN_TERMINAL_LINES: TerminalLine[] = [
  { kind: "cmd", text: "agentura run --against main" },
  { kind: "info", text: "  Loading suites from agentura.yaml..." },
  { kind: "info", text: "  4 suites · 46 eval cases · baseline branch: main" },
  { kind: "pass", text: "  ✓ accuracy      34/36   0.94   +0.03" },
  { kind: "warn", text: "  ↓ behavior      19/26   0.73   -0.14  regression" },
  { kind: "pass", text: "  ✓ latency       p95 1.9s  within SLA" },
  { kind: "pass", text: "  ✓ cost          $0.043/call  within budget" },
  { kind: "warn", text: "  → Merge blocked: behavior suite below threshold" },
  { kind: "accent", text: "  Inspect failing cases in PR comment #47" },
];

const OSS_TERMINAL_LINES: TerminalLine[] = [
  { kind: "cmd", text: "bunx agentura init" },
  { kind: "info", text: "  Generated agentura.yaml + starter eval suites" },
  { kind: "cmd", text: "bunx agentura run" },
  { kind: "pass", text: "  ✓ Local eval complete · baseline snapshot stored" },
  { kind: "cmd", text: "git checkout -b feat/new-retriever" },
  { kind: "cmd", text: "git push origin feat/new-retriever" },
  { kind: "accent", text: "  PR opened → Agentura checks posted automatically" },
];

function LiveEvalBoard() {
  const [rows, setRows] = useState<SuiteRow[]>(
    FINAL_ROWS.map((row) => ({ ...row, state: "running", score: "--", delta: "--" }))
  );
  const [finished, setFinished] = useState(false);
  const timeouts = useRef<number[]>([]);

  const run = () => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];

    setRows(FINAL_ROWS.map((row) => ({ ...row, state: "running", score: "--", delta: "--" })));
    setFinished(false);

    const sequence = [0, 2, 3, 1];
    sequence.forEach((rowIndex, step) => {
      timeouts.current.push(
        window.setTimeout(() => {
          setRows((current) =>
            current.map((row, index) => {
              return index === rowIndex ? { ...FINAL_ROWS[rowIndex] } : row;
            })
          );
          if (step === sequence.length - 1) {
            setFinished(true);
          }
        }, 760 + step * 660)
      );
    });
  };

  useEffect(() => {
    run();
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const statusText = finished
    ? rows.some((row) => row.state === "fail")
      ? "1 critical regression detected. merge gate active."
      : "All reliability checks passed."
    : "Sampling branch behavior...";

  return (
    <article className="live-board">
      <header className="window-header">
        <span className="window-dot dot-red" />
        <span className="window-dot dot-amber" />
        <span className="window-dot dot-green" />
        <p className="window-title">agentura-ci · pull request #47</p>
      </header>

      <div className="live-board-body">
        {rows.map((row) => (
          <div key={row.name} className={`suite-row suite-row-${row.state}`}>
            <span className="suite-icon">{row.state === "running" ? "⟳" : row.state === "pass" ? "✓" : "✕"}</span>
            <span className="suite-name">{row.name}</span>
            <span className="suite-score">{row.score}</span>
            <span className={`suite-delta ${row.delta.startsWith("-") ? "suite-delta-neg" : "suite-delta-pos"}`}>{row.delta}</span>
          </div>
        ))}
      </div>

      <footer className="live-board-footer">
        <p className={`live-status ${finished && rows.some((row) => row.state === "fail") ? "live-status-fail" : ""}`}>{statusText}</p>
        {finished ? (
          <button type="button" className="ghost-link-button" onClick={run}>
            replay
          </button>
        ) : null}
      </footer>
    </article>
  );
}

function TerminalPlayback({
  title,
  lines,
  minHeight,
}: {
  title: string;
  lines: TerminalLine[];
  minHeight: number;
}) {
  const [renderedLines, setRenderedLines] = useState<TerminalLine[]>([]);
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasPlayedRef = useRef(false);
  const timeouts = useRef<number[]>([]);

  const play = () => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];

    setRenderedLines([]);
    setDone(false);

    let elapsed = 0;
    lines.forEach((line, index) => {
      timeouts.current.push(
        window.setTimeout(() => {
          setRenderedLines((current) => [...current, line]);
          if (index === lines.length - 1) {
            setDone(true);
          }
        }, elapsed)
      );
      elapsed += line.delayMs ?? 170;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedRef.current) {
          hasPlayedRef.current = true;
          play();
        }
      },
      { threshold: 0.35 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <article className="terminal-shell" ref={containerRef}>
      <header className="window-header">
        <span className="window-dot dot-red" />
        <span className="window-dot dot-amber" />
        <span className="window-dot dot-green" />
        <p className="window-title">{title}</p>
        {done ? (
          <button type="button" className="ghost-link-button terminal-replay" onClick={play}>
            replay
          </button>
        ) : null}
      </header>

      <div className="terminal-body" style={{ minHeight }}>
        {renderedLines.map((line, index) => (
          <div key={`${line.text}-${index}`} className="terminal-line terminal-line-enter">
            {line.kind === "cmd" ? (
              <>
                <span className="terminal-prompt">$</span>
                <span className="terminal-cmd"> {line.text}</span>
              </>
            ) : (
              <span className={`terminal-${line.kind}`}>{line.text}</span>
            )}
          </div>
        ))}
        {done ? null : <span className="terminal-cursor" />}
      </div>
    </article>
  );
}

export default function HomePage() {
  const [storyTab, setStoryTab] = useState<StoryKey>("prompt");
  const [matrixTab, setMatrixTab] = useState<MatrixKey>("agentura");

  const activeStory = useMemo(() => STORY_CASES.find((item) => item.key === storyTab) ?? STORY_CASES[0], [storyTab]);
  const activeMatrix = useMemo(() => MATRIX_OPTIONS.find((item) => item.key === matrixTab) ?? MATRIX_OPTIONS[0], [matrixTab]);

  return (
    <div className="landing-root">
      <nav className="site-nav">
        <div className="site-nav-inner">
          <p className="brand">agentura<span>.</span></p>
          <div className="site-nav-links">
            <a href="#story">Story</a>
            <a href="#demos">Demos</a>
            <a href="#open-source">Open Source</a>
            <a href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
          <a className="primary-cta" href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
            Star on GitHub
          </a>
        </div>
      </nav>

      <main className="page-wrap">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">OPEN SOURCE RELIABILITY LAYER FOR AI AGENTS</p>
            <h1>
              Ship AI behavior with
              <br />
              <span>confidence, not guesswork.</span>
            </h1>
            <p className="hero-text">
              Agentura transforms every PR into a reliability checkpoint for prompts, model swaps, context changes, and performance.
              Built for teams that need enterprise trust with startup speed.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
                View Open Source Repo
              </a>
              <Link className="secondary-button" href="/docs/quickstart">
                Read Quickstart
              </Link>
            </div>
            <div className="hero-metrics">
              <article>
                <p>PRs Guarded</p>
                <strong>12.4k</strong>
              </article>
              <article>
                <p>Median Setup</p>
                <strong>08m</strong>
              </article>
              <article>
                <p>Regression Catch Rate</p>
                <strong>96%</strong>
              </article>
              <article>
                <p>False Positive Rate</p>
                <strong>1.8%</strong>
              </article>
            </div>
          </div>
          <LiveEvalBoard />
        </section>

        <section id="story" className="section-block">
          <header className="section-head">
            <p className="eyebrow">STORY MODE</p>
            <h2>Where AI reliability fails, and where Agentura wins.</h2>
          </header>

          <div className="tab-strip" role="tablist" aria-label="Failure scenarios">
            {STORY_CASES.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={storyTab === item.key}
                className={`tab-button ${storyTab === item.key ? "tab-button-active" : ""}`}
                onClick={() => setStoryTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="story-panel">
            <article>
              <h3>{activeStory.title}</h3>
              <p className="story-body">{activeStory.scenario}</p>
              <p className="story-body story-caught">{activeStory.caught}</p>
            </article>

            <article className="story-insight-card">
              <p className="insight-label">Impact profile</p>
              <div className="impact-row">
                <span>Quality drift</span>
                <div className="impact-track">
                  <span className="impact-bar impact-bar-neg" style={{ transform: `scaleX(${Math.abs(activeStory.scoreShift) * 2.3})` }} />
                </div>
                <strong>{activeStory.scoreShift.toFixed(2)}</strong>
              </div>
              <div className="impact-row">
                <span>Latency drift</span>
                <div className="impact-track">
                  <span className="impact-bar impact-bar-pos" style={{ transform: `scaleX(${Math.abs(activeStory.latencyShift) * 4.1})` }} />
                </div>
                <strong>{activeStory.latencyShift >= 0 ? `+${activeStory.latencyShift.toFixed(2)}` : activeStory.latencyShift.toFixed(2)}</strong>
              </div>
              <table className="signal-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Baseline</th>
                    <th>Branch</th>
                    <th>Delta</th>
                    <th>Gate</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStory.rows.map((row) => (
                    <tr key={row.metric}>
                      <td>{row.metric}</td>
                      <td>{row.baseline}</td>
                      <td>{row.branch}</td>
                      <td>{row.delta}</td>
                      <td className={row.gate === "BLOCK" ? "gate-block" : "gate-pass"}>{row.gate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </section>

        <section id="demos" className="section-block">
          <header className="section-head">
            <p className="eyebrow">LIVE DEMOS</p>
            <h2>Interactive evidence, not static screenshots.</h2>
          </header>

          <div className="demo-grid">
            <TerminalPlayback title="terminal · reliability gate" lines={RUN_TERMINAL_LINES} minHeight={280} />
            <article className="matrix-card">
              <div className="tab-strip matrix-strip" role="tablist" aria-label="Value comparison">
                {MATRIX_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={matrixTab === item.key}
                    className={`tab-button ${matrixTab === item.key ? "tab-button-active" : ""}`}
                    onClick={() => setMatrixTab(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="matrix-summary">{activeMatrix.summary}</p>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>{activeMatrix.label}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeMatrix.rows.map((row) => (
                    <tr key={row.capability}>
                      <td>{row.capability}</td>
                      <td>{row.verdict}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>
        </section>

        <section id="open-source" className="section-block">
          <header className="section-head">
            <p className="eyebrow">OPEN SOURCE</p>
            <h2>Free forever. Fork it, run it, extend it.</h2>
            <p className="section-subtext">
              Agentura is now open source. Build your own reliability control plane, contribute strategies, and plug it into your stack.
            </p>
          </header>

          <div className="oss-grid">
            <article className="oss-card">
              <h3>Fast track contribution path</h3>
              <ol>
                <li>Clone repo and run the quickstart in docs.</li>
                <li>Define eval suites that map to your production risks.</li>
                <li>Open a PR and ship with a reliability gate by default.</li>
              </ol>
              <div className="oss-links">
                <a href="https://github.com/SyntheticSynaptic/agentura" target="_blank" rel="noreferrer">
                  GitHub Repo
                </a>
                <Link href="/docs">Documentation</Link>
                <Link href="/docs/quickstart">Quickstart</Link>
              </div>
            </article>
            <TerminalPlayback title="terminal · open-source flow" lines={OSS_TERMINAL_LINES} minHeight={240} />
          </div>
        </section>

        <footer className="site-footer">
          <p className="brand">
            agentura<span>.</span>
          </p>
          <p>Open-source reliability for AI agents · MIT License</p>
        </footer>
      </main>

      <style jsx>{`
        .landing-root {
          background:
            radial-gradient(1200px 500px at 85% -10%, rgba(34, 211, 238, 0.16), transparent 58%),
            radial-gradient(900px 420px at 10% 8%, rgba(245, 158, 11, 0.12), transparent 54%),
            var(--bg);
          color: var(--text);
        }

        .site-nav {
          position: fixed;
          inset: 0 0 auto 0;
          z-index: 70;
          border-bottom: 1px solid var(--border);
          background: rgba(7, 8, 13, 0.78);
          backdrop-filter: blur(14px);
        }

        .site-nav-inner {
          margin: 0 auto;
          display: flex;
          max-width: 1240px;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 32px;
        }

        .brand {
          margin: 0;
          font-family: var(--display);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: var(--text);
        }

        .brand span {
          color: var(--cyan);
        }

        .site-nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .site-nav-links a {
          font-family: var(--body);
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
        }

        .site-nav-links a:hover {
          color: var(--text);
        }

        .primary-cta {
          border: 1px solid rgba(34, 211, 238, 0.35);
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.24), rgba(34, 211, 238, 0.08));
          padding: 9px 14px;
          font-family: var(--body);
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
        }

        .primary-cta:hover {
          transform: translateY(-1px);
        }

        .page-wrap {
          margin: 0 auto;
          max-width: 1240px;
          padding: 0 32px 80px;
        }

        .hero {
          position: relative;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 44px;
          align-items: center;
          padding-top: 130px;
        }

        .eyebrow {
          margin: 0 0 14px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cyan);
        }

        h1 {
          margin: 0;
          font-family: var(--display);
          font-size: clamp(2.4rem, 5vw, 4.2rem);
          line-height: 1.02;
          letter-spacing: -0.045em;
          color: var(--text);
        }

        h1 span {
          color: transparent;
          background: linear-gradient(110deg, var(--text), var(--cyan));
          -webkit-background-clip: text;
          background-clip: text;
        }

        .hero-text {
          margin: 18px 0 0;
          max-width: 620px;
          font-size: 18px;
          line-height: 1.65;
          color: var(--muted);
        }

        .hero-actions {
          margin-top: 26px;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          padding: 12px 18px;
          font-family: var(--body);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
        }

        .primary-button {
          border-color: rgba(34, 211, 238, 0.4);
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.22), rgba(34, 211, 238, 0.07));
          color: var(--text);
        }

        .secondary-button {
          background: rgba(17, 20, 35, 0.75);
          color: var(--muted);
        }

        .secondary-button:hover {
          color: var(--text);
        }

        .hero-metrics {
          margin-top: 28px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .hero-metrics article {
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.72);
          padding: 12px;
        }

        .hero-metrics p {
          margin: 0;
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .hero-metrics strong {
          margin-top: 8px;
          display: block;
          font-family: var(--display);
          font-size: 23px;
          letter-spacing: -0.03em;
          color: var(--text);
        }

        .live-board,
        .terminal-shell,
        .story-insight-card,
        .matrix-card,
        .oss-card {
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.8);
        }

        .window-header {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          background: rgba(23, 27, 45, 0.9);
          padding: 12px 14px;
        }

        .window-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .dot-red {
          background: #fb7185;
        }

        .dot-amber {
          background: #f59e0b;
        }

        .dot-green {
          background: #22c55e;
        }

        .window-title {
          margin: 0 0 0 6px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .live-board-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
        }

        .suite-row {
          display: grid;
          grid-template-columns: 18px 1fr auto auto;
          align-items: center;
          gap: 10px;
          border-left: 2px solid transparent;
          border: 1px solid var(--border);
          padding: 10px;
          font-family: var(--mono);
          font-size: 12px;
        }

        .suite-row-running {
          border-left-color: var(--amber);
          background: var(--amber-dim);
        }

        .suite-row-pass {
          border-left-color: var(--green);
          background: var(--green-dim);
        }

        .suite-row-fail {
          border-left-color: #fb7185;
          background: var(--red-dim);
        }

        .suite-icon {
          text-align: center;
        }

        .suite-name {
          color: var(--text);
        }

        .suite-score {
          color: var(--muted);
        }

        .suite-delta {
          font-weight: 600;
        }

        .suite-delta-neg {
          color: #fb7185;
        }

        .suite-delta-pos {
          color: var(--green);
        }

        .live-board-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid var(--border);
          padding: 12px 14px;
        }

        .live-status {
          margin: 0;
          font-family: var(--mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--cyan);
        }

        .live-status-fail {
          color: #fb7185;
        }

        .ghost-link-button {
          border: none;
          background: transparent;
          padding: 0;
          font-family: var(--mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--amber);
          cursor: pointer;
        }

        .section-block {
          margin-top: 88px;
        }

        .section-head h2 {
          margin: 0;
          font-family: var(--display);
          font-size: clamp(1.8rem, 3.8vw, 3rem);
          letter-spacing: -0.04em;
        }

        .section-subtext {
          margin: 12px 0 0;
          max-width: 680px;
          font-size: 17px;
          line-height: 1.6;
          color: var(--muted);
        }

        .tab-strip {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tab-button {
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.75);
          padding: 10px 14px;
          font-family: var(--body);
          font-size: 13px;
          color: var(--muted);
          cursor: pointer;
        }

        .tab-button-active {
          border-color: rgba(34, 211, 238, 0.4);
          background: rgba(34, 211, 238, 0.12);
          color: var(--text);
          transform: translateY(-1px);
        }

        .story-panel {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .story-panel article:first-child {
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.72);
          padding: 18px;
        }

        .story-panel h3,
        .oss-card h3 {
          margin: 0;
          font-family: var(--display);
          font-size: 24px;
          letter-spacing: -0.03em;
        }

        .story-body {
          margin: 14px 0 0;
          font-size: 15px;
          line-height: 1.65;
          color: var(--muted);
        }

        .story-caught {
          color: var(--cyan);
        }

        .story-insight-card {
          padding: 14px;
        }

        .insight-label {
          margin: 0;
          font-family: var(--mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }

        .impact-row {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 120px 1fr auto;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--text);
        }

        .impact-track {
          border: 1px solid var(--border);
          height: 10px;
          background: rgba(10, 12, 20, 0.8);
          overflow: hidden;
        }

        .impact-bar {
          display: block;
          transform-origin: left center;
          height: 100%;
          animation: barIn 420ms ease-out;
        }

        .impact-bar-neg {
          background: linear-gradient(90deg, #fb7185, rgba(251, 113, 133, 0.25));
        }

        .impact-bar-pos {
          background: linear-gradient(90deg, var(--cyan), rgba(34, 211, 238, 0.25));
        }

        .signal-table,
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          font-size: 12px;
        }

        .signal-table th,
        .signal-table td,
        .matrix-table th,
        .matrix-table td {
          border: 1px solid var(--border);
          padding: 8px;
          text-align: left;
        }

        .signal-table th,
        .matrix-table th {
          background: rgba(23, 27, 45, 0.86);
          font-family: var(--mono);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--muted);
        }

        .signal-table td,
        .matrix-table td {
          color: var(--text);
        }

        .gate-block {
          color: #fb7185 !important;
          font-weight: 600;
        }

        .gate-pass {
          color: var(--green) !important;
          font-weight: 600;
        }

        .demo-grid,
        .oss-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .terminal-shell {
          overflow: hidden;
        }

        .terminal-replay {
          margin-left: auto;
        }

        .terminal-body {
          padding: 16px;
          font-family: var(--mono);
          font-size: 12px;
          line-height: 1.75;
        }

        .terminal-line {
          white-space: pre-wrap;
        }

        .terminal-line-enter {
          animation: lineIn 280ms ease-out;
        }

        .terminal-prompt,
        .terminal-warn,
        .terminal-accent {
          color: var(--amber);
        }

        .terminal-cmd {
          color: var(--text);
        }

        .terminal-info {
          color: var(--muted);
        }

        .terminal-pass {
          color: var(--green);
        }

        .terminal-cursor {
          display: inline-block;
          width: 7px;
          height: 14px;
          background: var(--cyan);
          animation: blink 1s infinite;
          vertical-align: middle;
        }

        .matrix-card {
          padding: 14px;
        }

        .matrix-strip {
          margin-top: 0;
        }

        .matrix-summary {
          margin: 12px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--muted);
        }

        .oss-card {
          padding: 18px;
        }

        .oss-card ol {
          margin: 14px 0 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 1.8;
        }

        .oss-links {
          margin-top: 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .oss-links a {
          border: 1px solid var(--border);
          background: rgba(23, 27, 45, 0.86);
          padding: 8px 11px;
          font-size: 13px;
          color: var(--text);
          text-decoration: none;
        }

        .site-footer {
          margin-top: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-top: 1px solid var(--border);
          padding-top: 22px;
          color: var(--muted);
          font-size: 14px;
        }

        @keyframes barIn {
          0% {
            opacity: 0;
            transform: scaleX(0.25);
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes lineIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        @media (max-width: 1024px) {
          .hero,
          .story-panel,
          .demo-grid,
          .oss-grid {
            grid-template-columns: 1fr;
          }

          .hero-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .site-nav-inner,
          .page-wrap {
            padding-left: 18px;
            padding-right: 18px;
          }

          .site-nav-links {
            display: none;
          }

          .hero {
            padding-top: 102px;
          }

          .hero-metrics {
            grid-template-columns: 1fr;
          }

          .impact-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .site-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
