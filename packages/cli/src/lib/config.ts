import { promises as fs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export interface CliConfig {
  apiKey?: string;
  baseUrl?: string;
  groqApiKey?: string;
}

const CONFIG_DIR = path.join(homedir(), ".agentura");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function getDefaultBaseUrl(): string {
  const envBaseUrl = process.env.AGENTURA_BASE_URL?.trim();
  if (envBaseUrl) {
    return envBaseUrl;
  }

  return "https://agentura-ci.vercel.app";
}

async function readConfigRecord(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function loadConfig(): Promise<CliConfig | null> {
  const record = await readConfigRecord();

  const apiKey = typeof record.apiKey === "string" && record.apiKey.trim() ? record.apiKey : undefined;
  const baseUrl = typeof record.baseUrl === "string" && record.baseUrl.trim() ? record.baseUrl : undefined;
  const groqApiKey =
    typeof record.groqApiKey === "string" && record.groqApiKey.trim()
      ? record.groqApiKey
      : undefined;

  if (!apiKey && !baseUrl && !groqApiKey) {
    return null;
  }

  return { apiKey, baseUrl, groqApiKey };
}

export async function saveConfig(config: CliConfig): Promise<void> {
  const existing = await readConfigRecord();
  const nextConfig = { ...existing, ...config };

  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf-8");
}

export async function getApiKey(): Promise<string | null> {
  const envApiKey = process.env.AGENTURA_API_KEY?.trim();
  if (envApiKey) {
    return envApiKey;
  }

  const config = await loadConfig();
  return config?.apiKey ?? null;
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
