import Link from "next/link";
import { CodeBlock } from "../../../components/docs/CodeBlock";
import { ProseSection } from "../../../components/docs/ProseSection";

const localCommands = `npx agentura@latest init
npx agentura@latest run --local`;

const quickstartConfig = `version: 1
agent:
  type: http
  endpoint: https://your-agent.example.com/invoke
  timeout_ms: 10000

evals:
  - name: accuracy
    type: golden_dataset
    dataset: ./evals/accuracy.jsonl
    scorer: fuzzy_match
    threshold: 0.8

ci:
  block_on_regression: false
  compare_to: main
  post_comment: true`;

const datasetExample = `{"input": "what is the return policy", "expected": "30 days"}
{"input": "what is the capital of France", "expected": "Paris"}
{"input": "what color is the sky", "expected": "blue"}`;

export default function DocsQuickStartPage() {
  return (
    <ProseSection
      title="Quick Start"
      subtitle="Get your first eval running in under 5 minutes. No signup required."
    >
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Step 1 — Run locally first</h2>
        <CodeBlock code={localCommands} language="bash" />
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            init
          </code>{" "}
          creates an{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            agentura.yaml
          </code>{" "}
          config and a starter eval dataset in your project.{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            run --local
          </code>{" "}
          runs your evals on your machine — no GitHub App, no cloud, no login required.
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Step 2 — Point it at your agent
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Open{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            agentura.yaml
          </code>{" "}
          and update the endpoint:
        </p>
        <CodeBlock code={quickstartConfig} language="yaml" />
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          Your agent needs to accept POST requests with{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            {`{"input": "..."}`}
          </code>{" "}
          and return{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            {`{"output": "..."}`}
          </code>
          . No SDK required.
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Step 3 — Create your eval dataset
        </h2>
        <CodeBlock code={datasetExample} language="jsonl" />
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          Save this as{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            evals/accuracy.jsonl
          </code>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Step 4 — Run and see results
        </h2>
        <CodeBlock code="npx agentura@latest run --local" language="bash" />
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          You&apos;ll see pass/fail per case, scores against your baseline, and any regressions
          flagged.
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Step 5 (optional) — Add to CI with the GitHub App
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Once local evals are working, install the GitHub App to run evals automatically on every
          pull request:
        </p>
        <a
          href="https://github.com/apps/agenturaci/installations/new"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-md bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          Install Agentura GitHub App →
        </a>
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          After install, push{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            agentura.yaml
          </code>{" "}
          to your repo and open a PR. Results appear as a GitHub Check Run and PR comment within 30
          seconds.
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Next steps
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/docs/configuration"
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600"
          >
            <p className="text-sm font-semibold text-white">agentura.yaml reference →</p>
          </Link>
          <Link
            href="/docs/strategies"
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600"
          >
            <p className="text-sm font-semibold text-white">Eval strategies →</p>
          </Link>
          <Link
            href="/docs/cli/installation"
            className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-600"
          >
            <p className="text-sm font-semibold text-white">CLI reference →</p>
          </Link>
        </div>
      </section>
    </ProseSection>
  );
}
