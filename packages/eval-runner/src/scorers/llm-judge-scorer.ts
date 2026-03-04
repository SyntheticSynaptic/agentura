import Groq from "groq-sdk";

import type { JudgeFunction, JudgeResponse } from "../strategies/llm-judge";

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

function extractJsonBody(rawResponse: string): string {
  const trimmed = rawResponse.trim();

  if (!trimmed.includes("```")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function parseJudgeResponse(rawResponse: string): JudgeResponse {
  const jsonBody = extractJsonBody(rawResponse);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonBody);
  } catch (error) {
    throw new Error(
      `Judge response parsing failed: ${error instanceof Error ? error.message : "invalid JSON"}`
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Judge response parsing failed: response must be a JSON object");
  }

  const record = parsed as Record<string, unknown>;
  const score = record.score;
  const reason = record.reason;

  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new Error("Judge response parsing failed: `score` must be a number");
  }

  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new Error("Judge response parsing failed: `reason` must be a non-empty string");
  }

  return {
    score,
    reason,
  };
}

export function createGroqJudgeFunction(apiKey: string): JudgeFunction {
  const client = new Groq({ apiKey });

  return async ({ input, output, rubric, judgeModel }): Promise<JudgeResponse> => {
    const systemPrompt =
      "You are an evaluation judge. Score the following agent output. Respond with JSON only: { \"score\": number, \"reason\": string }.";

    const userPrompt = [
      `Rubric:\n${rubric}`,
      `Input:\n${input}`,
      `Output:\n${output}`,
      "Return only JSON with score in [0,1].",
    ].join("\n\n");

    const response = await client.chat.completions.create({
      model: judgeModel || DEFAULT_GROQ_MODEL,
      temperature: 0,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Groq judge returned empty response");
    }

    return parseJudgeResponse(text);
  };
}
