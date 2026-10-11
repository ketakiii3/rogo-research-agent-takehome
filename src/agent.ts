/**
 * The research agent: a tool-use loop over the mocked research tools.
 */

import Anthropic from "@anthropic-ai/sdk";
import { companies } from "./data.ts";
import { executeTool, toolSchemas } from "./tools.ts";

const MODEL = process.env.ROGO_MODEL ?? "claude-sonnet-5";
const MAX_ITERATIONS = 12;

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Rogo Research, an assistant that answers questions about companies for financial analysts.

Use the tools to look up companies, profiles, financials and source documents. Answer the analyst's question.

Our coverage universe:
${companies.map((c) => `- ${c.name} (${c.ticker})`).join("\n")}

Rules:
- Take every number from a tool result. For a derived figure (growth rate, CAGR, margin, ratio), show the inputs and the calculation.
- Cite each figure and factual claim: [financials: <company> FY<year>] for getFinancials data, or the document ID, e.g. [DOC-ITCH-001].
- Search the documents before stating causes, risks or outlook. Give a reason for a trend only if a document states it; otherwise describe the trend without explaining it.
- When you use a document figure that getFinancials also covers, check it against getFinancials. If they differ, report both and say they disagree.
- Keep caveats from tool results: preliminary or unaudited figures, delayed filings, reviews, warnings and guided slowdowns.
- When growth includes acquisitions, give organic and acquired growth separately if the sources split them.
- If a company name is ambiguous, ask which company the analyst means, or answer for one and state that assumption first.
- If a tool fails or finds nothing, say what you could not get. Do not fill the gap from memory.
`;

const EDITOR_PROMPT = `You are an editor. Rewrite the analyst's draft answer so that it reads clearly and is easy to follow. Keep it conversational. Return only the rewritten answer.

Do not change, add or remove any number, calculation, citation or caveat, and do not add claims that are not in the draft.`;

export type AgentEvent =
  | { type: "iteration"; n: number }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; ms: number }
  | { type: "tool_failed"; name: string; message: string };

export interface AgentResult {
  answer: string;
  iterations: number;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export async function runAgent(
  question: string,
  onEvent: (event: AgentEvent) => void,
): Promise<AgentResult> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];

  let draft = "";
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    onEvent({ type: "iteration", n: iterations });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools: toolSchemas,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length === 0) {
      draft = textOf(response);
      break;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const use of toolUses) {
      const startedAt = Date.now();
      onEvent({ type: "tool_start", name: use.name, input: use.input });

      let content: string;
      let isError = false;
      try {
        const output = await executeTool(use.name, use.input as Record<string, unknown>);
        content = JSON.stringify(output);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        content = `${use.name} failed: ${message}`;
        isError = true;
        onEvent({ type: "tool_failed", name: use.name, message });
      }

      onEvent({ type: "tool_end", name: use.name, ms: Date.now() - startedAt });
      toolResults.push({ type: "tool_result", tool_use_id: use.id, content, is_error: isError });
    }

    messages.push({ role: "user", content: toolResults });
  }

  if (!draft) {
    return {
      answer:
        "I couldn't put together a reliable answer from the sources I checked. Try asking a narrower question.",
      iterations,
    };
  }

  // Polish the draft before showing it to the analyst.
  const edited = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: EDITOR_PROMPT,
    messages: [
      {
        role: "user",
        content: `Draft answer:\n${draft}\n\nRewrite the draft answer.`,
      },
    ],
  });

  return { answer: textOf(edited), iterations };
}
