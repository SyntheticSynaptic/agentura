import { CodeBlock } from "../../../components/docs/CodeBlock";

const goldenConfig = `- name: accuracy
  type: golden_dataset
  dataset: ./evals/accuracy.jsonl
  scorer: exact_match
  threshold: 0.8`;

const goldenDataset = `{"input": "what is 2+2", "expected": "4"}
{"input": "what is the capital of France", "expected": "Paris"}`;

const llmJudgeConfig = `- name: quality
  type: llm_judge
  dataset: ./evals/quality.jsonl
  rubric: ./evals/quality-rubric.md
  threshold: 0.7`;

const llmJudgeRubric = `# Quality Rubric

Score 1.0 if the answer is correct and concise.
Score 0.5 if the answer is correct but verbose.
Score 0.0 if the answer is incorrect.`;

const performanceConfig = `- name: speed
  type: performance
  dataset: ./evals/accuracy.jsonl
  latency_threshold_ms: 5000
  threshold: 0.8`;

function BestForCallout({ text }: { text: string }) {
  return (
    <div className="mb-4 rounded-lg bg-slate-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Best for</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

export default function DocsStrategiesPage() {
  return (
    <article className="mx-auto w-full max-w-3xl pb-20">
      <header>
        <h1 className="mb-2 text-3xl font-bold text-white">Eval Strategies</h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Three ways to test your AI agent
        </p>
      </header>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          golden_dataset
        </h2>
        <BestForCallout text="Factual Q&A, classification, and structured outputs where you know the expected answer." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          This strategy runs each case and compares the agent output against the expected output.
          Use <strong className="font-medium text-white">exact_match</strong>,{" "}
          <strong className="font-medium text-white">contains</strong>, or{" "}
          <strong className="font-medium text-white">semantic_similarity</strong> scoring.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <CodeBlock code={goldenConfig} language="yaml" />
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example dataset</h3>
        <CodeBlock code={goldenDataset} language="jsonl" />
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          llm_judge
        </h2>
        <BestForCallout text="Subjective quality checks like tone, helpfulness, and style where there is no single exact answer." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          This strategy asks a judge model to score each response against your rubric. Scores are in
          the range <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">0.0-1.0</code>.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <CodeBlock code={llmJudgeConfig} language="yaml" />
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example rubric</h3>
        <CodeBlock code={llmJudgeRubric} language="markdown" />
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          performance
        </h2>
        <BestForCallout text="Latency budgets and speed regressions when response time matters as much as correctness." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          This strategy measures response latency per case and tracks suite-level metrics like p50,
          p95, and p99. It does not score semantic correctness.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <CodeBlock code={performanceConfig} language="yaml" />
      </section>
    </article>
  );
}
