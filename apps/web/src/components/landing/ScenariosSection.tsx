const scenarios = [
  {
    icon: "✏️",
    label: "PROMPT CHANGE",
    title: "You tweaked the wording. Now it drops key details.",
    story:
      "You updated your system prompt to make answers more concise. 95% of responses look fine. But your customer support bot quietly started omitting refund policy details — and 50 users got the wrong information before anyone noticed.",
    tag: "Detectable with golden_dataset eval",
  },
  {
    icon: "🔄",
    label: "MODEL UPGRADE",
    title: "You upgraded the model. Edge cases silently changed.",
    story:
      "You switched to a newer, cheaper model. Overall quality looks the same in testing. But your legal document summarizer started missing liability clauses on complex contracts — only discovered when a lawyer complained three weeks later.",
    tag: "Detectable with llm_judge eval",
  },
  {
    icon: "🔗",
    label: "CONTEXT CHANGE",
    title: "A new feature changed what your AI receives.",
    story:
      "You added a personalization feature that passes extra user context to your AI. A side effect: your enterprise chatbot's tone shifted from professional to casual. Your biggest customer flagged it in their quarterly review.",
    tag: "Detectable with llm_judge eval",
  },
];

export function ScenariosSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          Your AI can break in ways you&apos;d never expect
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-slate-300">
          A small change to your prompt, model, or context can silently change your AI&apos;s
          behavior. By the time you notice, users already have.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {scenarios.map((scenario) => (
            <article
              key={scenario.title}
              className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <p className="text-2xl">{scenario.icon}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                {scenario.label}
              </p>
              <h3 className="mt-3 text-base font-semibold text-white">{scenario.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{scenario.story}</p>
              <span className="mt-5 inline-flex w-fit rounded-full border border-red-900 bg-red-950 px-3 py-1 text-xs text-red-400">
                {scenario.tag}
              </span>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-300">
          Agentura catches all of these — automatically, on every PR.
        </p>
      </div>
    </section>
  );
}
