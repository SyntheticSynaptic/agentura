import Groq from "groq-sdk";

export interface LlmJudgeScore {
  score: number;
  reason: string;
}

interface GroqCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface GroqClientLike {
  chat: {
    completions: {
      create(params: {
        model: string;
        temperature: number;
        max_tokens: number;
        messages: Array<{ role: "system" | "user"; content: string }>;
      }): Promise<GroqCompletionResponse>;
    };
  };
}

type GroqClientFactory = (apiKey: string) => GroqClientLike;

const defaultGroqClientFactory: GroqClientFactory = (apiKey) =>
  new Groq({ apiKey }) as unknown as GroqClientLike;

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(1, score));
}

function stripCodeFences(text: string): string {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

function parseJudgeJson(text: string): LlmJudgeScore {
  try {
    const parsed = JSON.parse(stripCodeFences(text)) as Record<string, unknown>;
    const rawScore = parsed.score;
    const rawReason = parsed.reason;

    if (typeof rawScore !== "number") {
      return { score: 0, reason: "Judge response parse error" };
    }

    return {
      score: clampScore(rawScore),
      reason:
        typeof rawReason === "string" && rawReason.trim().length > 0
          ? rawReason.trim()
          : "Judge response parse error",
    };
  } catch {
    return { score: 0, reason: "Judge response parse error" };
  }
}

export async function scoreLlmJudge(
  input: string,
  output: string,
  rubric: string,
  apiKey: string,
  groqClientFactory: GroqClientFactory = defaultGroqClientFactory
): Promise<LlmJudgeScore> {
  try {
    const client = groqClientFactory(apiKey);

    const systemPrompt =
      "You are an eval judge. Score the output strictly according to the rubric. Respond only in JSON.";
    const userPrompt = [
      "Rubric:",
      rubric,
      "",
      `Input: ${input}`,
      `Output: ${output}`,
      "",
      "Respond with JSON only:",
      '{"score": 0.0-1.0, "reason": "one sentence explanation"}',
    ].join("\n");

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = response.choices?.[0]?.message?.content;
    if (!responseText || responseText.trim().length === 0) {
      return { score: 0, reason: "Judge response parse error" };
    }

    return parseJudgeJson(responseText);
  } catch {
    return { score: 0, reason: "Judge response parse error" };
  }
}
