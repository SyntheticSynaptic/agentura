import { CodeBlock } from "../../../components/docs/CodeBlock";
import { ProseSection } from "../../../components/docs/ProseSection";

const goldenConfig = `- name: accuracy
  type: golden_dataset
  dataset: ./evals/accuracy.jsonl
  scorer: fuzzy_match
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
  max_p95_ms: 3000
  max_cost_per_call_usd: 0.01
  threshold: 0.8`;

const toolUseConfig = `- name: tool-routing
  type: tool_use
  dataset: ./evals/tools.jsonl
  threshold: 0.9`;

const toolUseDataset = `{"input": "book a flight to Paris", "expected_tool": "search_flights", "expected_args": {"destination": "Paris"}}
{"input": "what is the weather in London", "expected_tool": "get_weather", "expected_args": {"city": "London"}}`;

const multiTurnDataset = `{
  "conversation": [
    {"role": "user", "content": "I am on the Pro plan, what storage do I get?"},
    {"role": "assistant", "expected": "Pro plan includes 100GB storage"},
    {"role": "user", "content": "Can I upgrade individual team members?"},
    {"role": "assistant", "expected": "Yes, you can manage seats in Settings > Team"}
  ],
  "eval_turns": [2, 4]
}`;

const multiTurnConfig = `- name: conversation
  type: golden_dataset
  dataset: ./evals/conversation.jsonl
  scorer: semantic_similarity
  threshold: 0.8`;

function BestFor({ text }: { text: string }) {
  return (
    <div className="mb-4 rounded-lg bg-slate-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">BEST FOR</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

export default function DocsStrategiesPage() {
  return (
    <ProseSection
      title="Eval Strategies"
      subtitle="Scorers and eval patterns for single-turn, tool-calling, and conversation workflows"
    >
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Scorers</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Scorer</th>
                <th className="px-4 py-3 font-medium">How it works</th>
                <th className="px-4 py-3 font-medium">Best for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="px-4 py-3 font-mono text-violet-300">exact_match</td>
                <td className="px-4 py-3">String must match exactly</td>
                <td className="px-4 py-3">Structured outputs, codes, IDs</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-violet-300">contains</td>
                <td className="px-4 py-3">Output must contain the expected string</td>
                <td className="px-4 py-3">Partial matches, key phrases</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-violet-300">fuzzy_match</td>
                <td className="px-4 py-3">Token overlap score</td>
                <td className="px-4 py-3">Most general cases</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-violet-300">semantic_similarity</td>
                <td className="px-4 py-3">Embedding cosine similarity</td>
                <td className="px-4 py-3">When wording can vary</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Scorer auto-detects your LLM provider for{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            semantic_similarity
          </code>
          : set{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            ANTHROPIC_API_KEY
          </code>
          ,{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            OPENAI_API_KEY
          </code>
          ,{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            GEMINI_API_KEY
          </code>
          , or{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            GROQ_API_KEY
          </code>
          . Falls back to Ollama if running locally. Falls back to{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            fuzzy_match
          </code>{" "}
          if no provider is available.
        </p>
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          golden_dataset
        </h2>
        <BestFor text="Known-answer tasks like factual QA, classification, and structured output checks." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Runs your input/expected pairs and scores each response with your selected scorer. Use{" "}
          <strong className="font-medium text-white">fuzzy_match</strong> for most general cases,{" "}
          <strong className="font-medium text-white">exact_match</strong> for strict outputs,{" "}
          <strong className="font-medium text-white">contains</strong> for key phrases, and{" "}
          <strong className="font-medium text-white">semantic_similarity</strong> when wording can
          vary.
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
        <BestFor text="Subjective quality checks where there is no single exact answer (tone, helpfulness, completeness)." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Uses an LLM judge to score outputs against your rubric on a 0.0–1.0 scale. This is ideal
          for evaluating behavior and communication quality.
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
        <BestFor text="Latency budgets and speed regression detection when response time and cost ceilings matter." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Measures per-case latency and cost, then compares suite-level results against your
          thresholds. Performance suites catch slowdowns and cost spikes before users feel them.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <CodeBlock code={performanceConfig} language="yaml" />
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          tool_use
        </h2>
        <BestFor text="Agents that call tools or functions — validates that the right tool was called with the right arguments." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Checks that your agent calls the expected tool, passes the expected arguments, and
          returns the expected output. Useful for agents that route to different tools based on
          user intent.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <CodeBlock code={toolUseConfig} language="yaml" />
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example dataset</h3>
        <CodeBlock code={toolUseDataset} language="jsonl" />
      </section>

      <section>
        <h2 className="mb-4 mt-12 border-t border-slate-800 pt-8 text-xl font-semibold text-white">
          Multi-turn conversation eval
        </h2>
        <BestFor text="Conversational agents where behavior across multiple turns matters — not just single responses." />
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Most eval tools only test single questions. Agentura tests whether your agent behaves
          consistently across a full conversation, including whether it remembers context from
          earlier turns.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example dataset</h3>
        <CodeBlock code={multiTurnDataset} language="jsonl" />
        <p className="mb-4 mt-4 text-sm leading-relaxed text-slate-300">
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            eval_turns
          </code>{" "}
          specifies which assistant turns to score. Turns not listed are used as conversation
          context but not scored.
        </p>
        <h3 className="mb-2 mt-6 text-base font-semibold text-white">Example config</h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-300">
          Multi-turn cases work with{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">
            golden_dataset
          </code>{" "}
          — no special config needed. Just include conversation-format entries in your dataset file
          alongside regular single-turn entries.
        </p>
        <CodeBlock code={multiTurnConfig} language="yaml" />
      </section>
    </ProseSection>
  );
}
