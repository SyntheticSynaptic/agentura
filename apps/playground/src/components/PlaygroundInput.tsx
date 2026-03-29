"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BranchOption = {
  value: "friendly" | "model_swap" | "truncate" | "guardrail";
  label: string;
  description: string;
};

type EvalResult = {
  baseline: {
    accuracy: number;
    tone: number;
    policy: number;
    output: string;
  };
  branch: {
    accuracy: number;
    tone: number;
    policy: number;
    output: string;
  };
  gates: {
    accuracy: "PASS" | "BLOCK";
    tone: "PASS" | "BLOCK";
    policy: "PASS" | "BLOCK";
  };
  decision: string;
  scenario: string;
  modelsUsed: {
    baseline: string;
    branch: string;
    judge: string;
  };
  rateLimitRemaining: number;
};

const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant that answers questions about store policies clearly, accurately, and in a professional tone. If a policy detail is unknown, say so plainly and do not invent it.";

const BRANCH_OPTIONS: BranchOption[] = [
  {
    value: "friendly",
    label: "Friendlier tone",
    description: 'Adds "Of course!" prefix — tests whether tone shift affects policy behaviour',
  },
  {
    value: "model_swap",
    label: "Model swap (70B → 8B)",
    description: "Switches to a smaller model mid-sprint — the most common silent production regression",
  },
  {
    value: "truncate",
    label: "Truncate system prompt",
    description: "Cuts system prompt by 50% — simulates context budget reduction",
  },
  {
    value: "guardrail",
    label: "Add safety guardrail",
    description: "Appends compliance disclaimer — should improve policy score",
  },
];

function formatScore(score: number) {
  return `${(score * 100).toFixed(0)}%`;
}

function encodeResult(result: EvalResult) {
  return btoa(encodeURIComponent(JSON.stringify(result)));
}

function decodeResult(encoded: string): EvalResult | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded))) as EvalResult;
  } catch {
    return null;
  }
}

export function PlaygroundInput() {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userMessage, setUserMessage] = useState("What is the return policy?");
  const [expectedContains, setExpectedContains] = useState("30 days");
  const [branchChange, setBranchChange] = useState<BranchOption["value"]>("friendly");
  const [results, setResults] = useState<EvalResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("r");
    if (!encoded) {
      return;
    }

    const decoded = decodeResult(encoded);
    if (decoded) {
      setResults(decoded);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const selectedOption = BRANCH_OPTIONS.find((option) => option.value === branchChange) ?? BRANCH_OPTIONS[0];

  const yamlPreview = useMemo(
    () => `version: 1

agent:
  type: http
  endpoint: https://your-agent.example.com/api/agent
  timeout_ms: 30000

evals:
  - name: policy-regression
    type: golden_dataset
    scorer: contains
    dataset: ./evals/policy.jsonl
    threshold: 0.80

# sample case
# {"input":"${userMessage.replace(/"/g, '\\"')}","expected":"${expectedContains.replace(/"/g, '\\"')}"}
`,
    [expectedContains, userMessage]
  );

  function startCooldown(seconds: number) {
    setCooldown(seconds);
  }

  async function handleRun() {
    if (cooldown > 0 || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userMessage, expectedContains, branchChange }),
      });

      if (res.status === 429) {
        const data = (await res.json()) as { message?: string; retryAfter?: number };
        setError(data.message ?? "Too many eval runs. Please wait.");
        startCooldown(data.retryAfter ?? 60);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Unable to run playground eval");
      }

      const data = (await res.json()) as EvalResult;
      setResults(data);
      startCooldown(15);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run playground eval");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShare() {
    if (!results) {
      return;
    }

    const shareUrl = `${window.location.origin}?r=${encodeResult(results)}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="playground-shell">
      <div className="playground-grid">
        <article className="playground-panel input-panel">
          <div className="panel-head">
            <p className="panel-kicker">SETUP</p>
            <h2>Define the baseline and choose the branch mutation.</h2>
          </div>

          <label className="field">
            <span>System prompt</span>
            <textarea rows={7} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>User message</span>
              <input value={userMessage} onChange={(event) => setUserMessage(event.target.value)} />
            </label>
            <label className="field">
              <span>Expected output contains</span>
              <input value={expectedContains} onChange={(event) => setExpectedContains(event.target.value)} />
            </label>
          </div>

          <div className="field">
            <span>Branch change</span>
            <div className="branch-options">
              {BRANCH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`branch-card ${branchChange === option.value ? "branch-card-active" : ""}`}
                  onClick={() => setBranchChange(option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="hint-card">
            <p className="hint-label">Selected scenario</p>
            <strong>{selectedOption.label}</strong>
            <span>{selectedOption.description}</span>
          </div>

          <div className="actions-row">
            <button className="run-button" disabled={cooldown > 0 || isLoading} onClick={handleRun}>
              {isLoading ? "Running eval..." : cooldown > 0 ? `Ready in ${cooldown}s` : "Run Eval →"}
            </button>
            <Link className="ghost-link" href={process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://agentura-ci.vercel.app"}>
              Install Agentura
            </Link>
          </div>

          {error ? <p className="status-error">{error}</p> : <p className="status-copy">5 runs per minute per IP, enforced server-side.</p>}

          <div className="config-card">
            <div className="config-head">
              <p className="panel-kicker">YAML PREVIEW</p>
              <button type="button" className="ghost-inline" onClick={() => navigator.clipboard.writeText(yamlPreview)}>
                Copy config
              </button>
            </div>
            <pre>{yamlPreview}</pre>
          </div>
        </article>

        <article className="playground-panel result-panel">
          {results ? (
            <>
              <div className="panel-head panel-head-row">
                <div>
                  <p className="panel-kicker">RESULT</p>
                  <h2>{results.decision}</h2>
                </div>
                <p className={`decision-chip ${results.decision === "MERGE BLOCKED" ? "decision-chip-blocked" : "decision-chip-pass"}`}>
                  {results.scenario}
                </p>
              </div>

              <div className="result-cards">
                <div className="result-card">
                  <p>Baseline</p>
                  <strong>{results.modelsUsed.baseline}</strong>
                  <span>Main branch reference</span>
                </div>
                <div className="result-card">
                  <p>Branch</p>
                  <strong>{results.modelsUsed.branch}</strong>
                  <span>Scenario under test</span>
                </div>
              </div>

              <div className="metric-table">
                <div className="metric-row">
                  <span>Accuracy</span>
                  <span>
                    {formatScore(results.baseline.accuracy)} → {formatScore(results.branch.accuracy)}
                  </span>
                  <strong className={results.gates.accuracy === "BLOCK" ? "metric-negative" : "metric-positive"}>
                    {results.gates.accuracy}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Tone</span>
                  <span>
                    {formatScore(results.baseline.tone)} → {formatScore(results.branch.tone)}
                  </span>
                  <strong className={results.gates.tone === "BLOCK" ? "metric-negative" : "metric-positive"}>
                    {results.gates.tone}
                  </strong>
                </div>
                <div className="metric-row">
                  <span>Policy fidelity</span>
                  <span>
                    {formatScore(results.baseline.policy)} → {formatScore(results.branch.policy)}
                  </span>
                  <strong className={results.gates.policy === "BLOCK" ? "metric-negative" : "metric-positive"}>
                    {results.gates.policy}
                  </strong>
                </div>
              </div>

              <div className="note-card">
                <p className="hint-label">Judge model</p>
                <strong>{results.modelsUsed.judge}</strong>
                <span>JSON-scored tone review with deterministic settings.</span>
              </div>

              <div className="result-actions">
                <button type="button" className="ghost-inline" onClick={() => setShowOutputs((current) => !current)}>
                  {showOutputs ? "Hide outputs" : "View outputs"}
                </button>
                <button type="button" className="ghost-inline" onClick={handleShare}>
                  {copied ? "Link copied" : "↗ Share result"}
                </button>
                <p className="remaining-copy">Rate limit remaining: {results.rateLimitRemaining}</p>
              </div>

              {showOutputs ? (
                <div className="output-grid">
                  <div className="output-card">
                    <p>Baseline output</p>
                    <pre>{results.baseline.output}</pre>
                  </div>
                  <div className="output-card">
                    <p>Branch output</p>
                    <pre>{results.branch.output}</pre>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="result-empty">
              <p className="panel-kicker">RESULT</p>
              <h2>Run the suite to see the branch verdict.</h2>
              <p>
                This panel will fill with baseline-versus-branch scores, merge gates, model details, and a shareable
                result URL once the eval completes.
              </p>
            </div>
          )}
        </article>
      </div>

      <style jsx>{`
        .playground-shell {
          margin-top: 12px;
        }

        .playground-grid {
          display: grid;
          grid-template-columns: 1.04fr 0.96fr;
          gap: 18px;
        }

        .playground-panel {
          border: 1px solid var(--border);
          background: rgba(17, 20, 35, 0.84);
          padding: 22px;
          backdrop-filter: blur(16px);
        }

        .panel-head {
          margin-bottom: 16px;
        }

        .panel-head-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .panel-kicker,
        .hint-label {
          margin: 0 0 8px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--cyan);
        }

        h2 {
          margin: 0;
          font-family: var(--display);
          font-size: clamp(1.6rem, 3vw, 2.6rem);
          letter-spacing: -0.05em;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 14px;
        }

        .field span {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .field textarea,
        .field input {
          width: 100%;
          border: 1px solid var(--border);
          background: rgba(7, 8, 13, 0.64);
          padding: 12px;
          color: var(--text);
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .branch-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .branch-card,
        .hint-card,
        .result-card,
        .note-card,
        .config-card,
        .output-card {
          border: 1px solid var(--border);
          background: rgba(7, 8, 13, 0.55);
        }

        .branch-card {
          display: flex;
          min-height: 120px;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
          padding: 14px;
          text-align: left;
          color: var(--text);
        }

        .branch-card strong {
          font-size: 15px;
        }

        .branch-card small {
          color: var(--muted);
          line-height: 1.55;
        }

        .branch-card-active {
          border-color: rgba(34, 211, 238, 0.4);
          box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.25);
          background: rgba(34, 211, 238, 0.1);
        }

        .hint-card,
        .note-card {
          margin-top: 16px;
          padding: 14px;
        }

        .hint-card strong,
        .note-card strong {
          display: block;
          font-size: 16px;
        }

        .hint-card span,
        .note-card span {
          margin-top: 8px;
          display: block;
          color: var(--muted);
          line-height: 1.6;
        }

        .actions-row,
        .result-actions,
        .config-head {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .run-button,
        .ghost-link,
        .ghost-inline {
          border: 1px solid var(--border);
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
        }

        .run-button {
          border-color: rgba(245, 158, 11, 0.42);
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(245, 158, 11, 0.08));
        }

        .run-button:disabled {
          opacity: 0.65;
        }

        .ghost-link,
        .ghost-inline {
          background: rgba(17, 20, 35, 0.72);
        }

        .status-copy,
        .status-error,
        .remaining-copy {
          margin: 14px 0 0;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .status-copy,
        .remaining-copy {
          color: var(--muted);
        }

        .status-error {
          color: var(--amber);
        }

        .config-card {
          margin-top: 18px;
          padding: 14px;
        }

        .config-card pre,
        .output-card pre {
          margin: 12px 0 0;
          overflow: auto;
          font-family: var(--mono);
          font-size: 12px;
          line-height: 1.7;
          white-space: pre-wrap;
          color: var(--text);
        }

        .decision-chip {
          margin: 0;
          padding: 8px 10px;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .decision-chip-pass {
          border: 1px solid rgba(34, 197, 94, 0.36);
          background: rgba(34, 197, 94, 0.12);
          color: var(--green);
        }

        .decision-chip-blocked {
          border: 1px solid rgba(239, 68, 68, 0.36);
          background: rgba(239, 68, 68, 0.12);
          color: var(--red);
        }

        .result-cards {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .result-card {
          padding: 14px;
        }

        .result-card p {
          margin: 0;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .result-card strong {
          margin-top: 10px;
          display: block;
          font-family: var(--display);
          font-size: 22px;
          letter-spacing: -0.05em;
        }

        .result-card span {
          margin-top: 8px;
          display: block;
          color: var(--muted);
        }

        .metric-table {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: 130px 1fr auto;
          gap: 10px;
          align-items: center;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
          padding-bottom: 10px;
        }

        .metric-positive {
          color: var(--green);
        }

        .metric-negative {
          color: var(--red);
        }

        .result-empty {
          display: flex;
          min-height: 100%;
          flex-direction: column;
          justify-content: center;
        }

        .result-empty p:last-child {
          max-width: 520px;
          line-height: 1.7;
          color: var(--muted);
        }

        .output-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .output-card {
          padding: 14px;
        }

        .output-card p {
          margin: 0;
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        @media (max-width: 1040px) {
          .playground-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .field-grid,
          .branch-options,
          .result-cards,
          .output-grid {
            grid-template-columns: 1fr;
          }

          .metric-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
