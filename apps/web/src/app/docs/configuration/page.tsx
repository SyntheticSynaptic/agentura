import { CodeBlock } from "../../../components/docs/CodeBlock";

type FieldInfo = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
};

function FieldCard({ name, type, required, description, example }: FieldInfo) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">{name}</code>
        <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{type}</span>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            required ? "bg-violet-950 text-violet-300" : "bg-slate-800 text-slate-300"
          }`}
        >
          {required ? "Required" : "Optional"}
        </span>
      </div>
      <p className="mb-4 mt-3 text-sm leading-relaxed text-slate-300">{description}</p>
      <CodeBlock code={example} />
    </div>
  );
}

const versionFields: FieldInfo[] = [
  {
    name: "version",
    type: "number",
    required: true,
    description: "Configuration schema version. Must be set to 1.",
    example: "version: 1",
  },
];

const agentFields: FieldInfo[] = [
  {
    name: "agent",
    type: "object",
    required: true,
    description: "Defines how Agentura calls your agent.",
    example: "agent:\n  type: http\n  endpoint: https://your-agent.example.com/api/agent",
  },
  {
    name: "agent.type",
    type: "string",
    required: true,
    description: "Agent type. For onboarding, use http.",
    example: "type: http",
  },
  {
    name: "agent.endpoint",
    type: "string",
    required: true,
    description: "HTTP endpoint that accepts { input } and returns { output }.",
    example: "endpoint: https://your-agent.example.com/api/agent",
  },
  {
    name: "agent.timeout_ms",
    type: "number",
    required: false,
    description: "Per-case timeout in milliseconds. Defaults to 10000.",
    example: "timeout_ms: 10000",
  },
  {
    name: "agent.headers",
    type: "map<string,string>",
    required: false,
    description: "Optional headers sent with each request to your agent endpoint.",
    example: 'headers:\n  Authorization: "Bearer your-token"',
  },
];

const evalFields: FieldInfo[] = [
  {
    name: "evals",
    type: "array",
    required: true,
    description: "List of eval suites to run on each pull request.",
    example: "evals:\n  - name: accuracy",
  },
  {
    name: "evals[].name",
    type: "string",
    required: true,
    description: "Unique suite name.",
    example: "name: accuracy",
  },
  {
    name: "evals[].type",
    type: "golden_dataset | llm_judge | performance",
    required: true,
    description: "Selects the scoring strategy for this suite.",
    example: "type: golden_dataset",
  },
  {
    name: "evals[].dataset",
    type: "string",
    required: false,
    description: "Path to JSONL dataset. Required for golden_dataset and llm_judge suites.",
    example: "dataset: ./evals/accuracy.jsonl",
  },
  {
    name: "evals[].rubric",
    type: "string",
    required: false,
    description: "Path to rubric markdown file. Required for llm_judge.",
    example: "rubric: ./evals/quality-rubric.md",
  },
  {
    name: "evals[].scorer",
    type: "exact_match | contains | semantic_similarity",
    required: false,
    description: "Golden dataset scoring method. Defaults to exact_match.",
    example: "scorer: exact_match",
  },
  {
    name: "evals[].threshold",
    type: "number (0-1)",
    required: false,
    description: "Pass threshold for suite score. Defaults to 0.8.",
    example: "threshold: 0.8",
  },
  {
    name: "evals[].judge_model",
    type: "string",
    required: false,
    description: "Model override for llm_judge suites. Defaults to llama-3.1-8b-instant.",
    example: "judge_model: llama-3.1-8b-instant",
  },
  {
    name: "evals[].latency_threshold_ms",
    type: "number",
    required: false,
    description: "Maximum per-case latency for performance suites. Required for performance.",
    example: "latency_threshold_ms: 5000",
  },
];

const ciFields: FieldInfo[] = [
  {
    name: "ci.block_on_regression",
    type: "boolean",
    required: false,
    description: "If true, fail the PR check when regression is detected.",
    example: "block_on_regression: false",
  },
  {
    name: "ci.regression_threshold",
    type: "number (0-1)",
    required: false,
    description: "Allowed score drop before a regression is flagged. Default is 0.05.",
    example: "regression_threshold: 0.05",
  },
  {
    name: "ci.compare_to",
    type: "string",
    required: false,
    description: "Baseline branch name for comparisons. Default is main.",
    example: "compare_to: main",
  },
  {
    name: "ci.post_comment",
    type: "boolean",
    required: false,
    description: "Post or update Agentura PR comments after each run. Default is true.",
    example: "post_comment: true",
  },
  {
    name: "ci.fail_on_new_suite",
    type: "boolean",
    required: false,
    description: "If true, fail when a new suite has no baseline yet. Default is false.",
    example: "fail_on_new_suite: false",
  },
];

const fullExample = `version: 1

agent:
  type: http
  endpoint: https://your-agent.example.com/api/agent
  timeout_ms: 10000
  headers:
    Authorization: Bearer your-token

evals:
  - name: accuracy
    type: golden_dataset
    dataset: ./evals/accuracy.jsonl
    scorer: exact_match
    threshold: 0.8

  - name: quality
    type: llm_judge
    dataset: ./evals/quality.jsonl
    rubric: ./evals/quality-rubric.md
    judge_model: llama-3.1-8b-instant
    threshold: 0.7

  - name: speed
    type: performance
    dataset: ./evals/accuracy.jsonl
    latency_threshold_ms: 5000
    threshold: 0.8

ci:
  block_on_regression: false
  regression_threshold: 0.05
  compare_to: main
  post_comment: true
  fail_on_new_suite: false`;

export default function DocsConfigurationPage() {
  return (
    <article className="mx-auto w-full max-w-3xl pb-20">
      <header>
        <h1 className="mb-2 text-3xl font-bold text-white">agentura.yaml Reference</h1>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          All configuration options explained
        </p>
      </header>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          version
        </h2>
        <div className="space-y-4">
          {versionFields.map((field) => (
            <FieldCard key={field.name} {...field} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          agent
        </h2>
        <div className="space-y-4">
          {agentFields.map((field) => (
            <FieldCard key={field.name} {...field} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          evals
        </h2>
        <div className="space-y-4">
          {evalFields.map((field) => (
            <FieldCard key={field.name} {...field} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">ci</h2>
        <div className="space-y-4">
          {ciFields.map((field) => (
            <FieldCard key={field.name} {...field} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Complete example
        </h2>
        <CodeBlock code={fullExample} language="yaml" />
      </section>
    </article>
  );
}
