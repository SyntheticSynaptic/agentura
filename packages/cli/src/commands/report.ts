import path from "node:path";

import chalk from "chalk";

import { createAgentFunctionFromConfig } from "../lib/reference";
import { generateClinicalAuditReport } from "../lib/report";

interface ReportCommandOptions {
  since?: string;
  reference?: string;
  out?: string;
}

export async function reportCommand(options: ReportCommandOptions = {}): Promise<void> {
  try {
    if (!options.since) {
      throw new Error("report requires --since <YYYY-MM-DD>");
    }

    if (!options.reference) {
      throw new Error("report requires --reference <label>");
    }

    if (!options.out) {
      throw new Error("report requires --out <file>");
    }

    const cwd = process.cwd();
    const agentFn = await createAgentFunctionFromConfig(cwd);

    const result = await generateClinicalAuditReport({
      cwd,
      since: options.since,
      reference: options.reference,
      outPath: options.out,
      agentFn,
    });

    console.log(`Clinical audit report written to ${path.relative(cwd, result.outputPath)}`);
    console.log(`  Agent: ${result.summary.agentName}`);
    console.log(`  Runs: ${String(result.summary.totalRuns)}`);
    console.log(`  Traces: ${String(result.summary.totalTraces)}`);
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown report error";
    console.error(chalk.red(message));
    process.exit(1);
  }
}
