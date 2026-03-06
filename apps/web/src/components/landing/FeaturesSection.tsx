const features = [
  {
    title: "Golden Dataset Testing",
    description:
      "Test your agent against a curated set of input/output pairs. Catch regressions before they reach production.",
  },
  {
    title: "LLM-as-Judge",
    description:
      "Use an LLM to evaluate subjective quality — tone, accuracy, helpfulness. No rigid exact-match required.",
  },
  {
    title: "Performance Benchmarking",
    description:
      "Track latency across every eval run. Get p50, p95, p99. Know when your agent slows down.",
  },
  {
    title: "Regression Detection",
    description:
      "Automatically compare every PR against your main branch baseline. Block merges when quality drops.",
  },
  {
    title: "Zero SDK Required",
    description:
      "Works with any agent that has an HTTP endpoint. No code changes. No framework lock-in.",
  },
  {
    title: "CLI for Local Testing",
    description: "Run evals locally before pushing. `agentura run` gives you instant feedback.",
  },
];

export function FeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          Everything you need to ship AI with confidence
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
