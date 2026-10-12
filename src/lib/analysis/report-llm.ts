import { getStructuredLanguageModel } from "@/lib/ai/llm";
import type { ReportIssue } from "@/lib/analysis/report-types";
import { generateObject } from "ai";
import { z } from "zod";

const reportSchema = z.object({
  architectureSummary: z.string(),
  securitySummary: z.string(),
  performanceSummary: z.string(),
  issues: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(["critical", "high", "medium", "low"]),
      category: z.enum(["architecture", "security", "performance"]),
      filePath: z.string().nullable(),
    }),
  ),
});

function formatChunks(
  chunks: Array<{
    filePath: string;
    content: string;
    startLine: number | null;
    endLine: number | null;
  }>,
): string {
  return chunks
    .map((chunk, index) => {
      const lines =
        chunk.startLine && chunk.endLine
          ? `L${chunk.startLine}-L${chunk.endLine}`
          : "lines unknown";
      return [
        `### Chunk ${index + 1}`,
        `File: ${chunk.filePath} (${lines})`,
        "```",
        chunk.content.slice(0, 2500),
        "```",
      ].join("\n");
    })
    .join("\n\n");
}

export type LlmReportResult = {
  architectureSummary: string;
  securitySummary: string;
  performanceSummary: string;
  issues: ReportIssue[];
};

export async function runLlmHealthReview(options: {
  projectName: string;
  framework: string | null;
  chunks: Array<{
    filePath: string;
    content: string;
    startLine: number | null;
    endLine: number | null;
  }>;
}): Promise<LlmReportResult> {
  const sampled = options.chunks.slice(0, 24);

  const prompt = [
      "You are an AI senior engineer reviewing a JavaScript/TypeScript codebase.",
      "Find potential issues for the developer to verify — not certified vulnerabilities or proven bottlenecks.",
      "",
      `Project: ${options.projectName}`,
      `Framework: ${options.framework ?? "Unknown"}`,
      "",
      "Cover these categories only: architecture, security, performance.",
      "Severity guide:",
      "- critical: likely security breach or data loss risk",
      "- high: likely incorrect behavior or major performance problem",
      "- medium: maintainability / structure problem",
      "- low: minor concern",
      "",
      "Return at most 15 high-signal issues total.",
      "Use filePath when the snippet supports it; otherwise null.",
      "",
      "IMPORTANT: Respond with strictly valid JSON matching the schema. No markdown, no extra text.",
      "",
      "Code snippets:",
      formatChunks(sampled),
    ].join("\n");

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { object } = await generateObject({
        model: getStructuredLanguageModel(),
        schema: reportSchema,
        prompt,
      });

      return {
        architectureSummary: object.architectureSummary,
        securitySummary: object.securitySummary,
        performanceSummary: object.performanceSummary,
        issues: object.issues,
      };
    } catch (error) {
      console.error(
        `[report-llm] generateObject attempt ${attempt}/${maxAttempts} failed:`,
        error instanceof Error ? error.message : error,
      );
      if (attempt === maxAttempts) {
        // Return a graceful fallback instead of crashing
        console.error("[report-llm] All attempts failed, returning fallback report.");
        return {
          architectureSummary:
            "Unable to generate AI summary — the language model failed to return valid structured output. Please retry the analysis.",
          securitySummary: "Analysis unavailable.",
          performanceSummary: "Analysis unavailable.",
          issues: [],
        };
      }
      // Brief pause before retrying
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  // TypeScript: unreachable, but satisfies return type
  throw new Error("Unreachable");
}
