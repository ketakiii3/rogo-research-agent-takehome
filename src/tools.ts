/**
 * The agent's tools. These stand in for the real research APIs — same shapes,
 * local data, plus a little latency so the app behaves like the real thing.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { companies, documents, financials, type Company } from "./data.ts";

/** Thrown when a tool cannot service a request. */
export class ToolError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolves a company name or ticker to exactly one company in the coverage universe. */
export function findCompany(name: string): Company {
  const needle = String(name).trim().toLowerCase();
  const exact = companies.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact;

  const candidates = companies.filter(
    (c) =>
      c.ticker.toLowerCase() === needle ||
      c.name.toLowerCase().includes(needle) ||
      needle.includes(c.name.toLowerCase()),
  );
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    const list = candidates.map((c) => `${c.name} (${c.ticker})`).join(", ");
    throw new ToolError(
      `"${name}" is ambiguous; it matches ${list}. Ask the analyst which company they mean.`,
    );
  }
  throw new ToolError(`"${name}" is not in our coverage universe.`);
}

export const toolSchemas: Anthropic.Tool[] = [
  {
    name: "searchCompanies",
    description:
      "Search the coverage universe for companies matching a name. Returns the company name, ticker and sector for each match.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "A company name or part of one." },
      },
      required: ["query"],
    },
  },
  {
    name: "getCompanyProfile",
    description:
      "Get a company's profile: description, sector, headquarters, headcount, business segments and the filings we hold.",
    input_schema: {
      type: "object",
      properties: {
        company: { type: "string", description: "The company name or ticker." },
      },
      required: ["company"],
    },
  },
  {
    name: "getFinancials",
    description:
      "Get annual and quarterly financials for a company: revenue, gross margin, operating income, net income and free cash flow.",
    input_schema: {
      type: "object",
      properties: {
        company: { type: "string", description: "The company name or ticker." },
      },
      required: ["company"],
    },
  },
  {
    name: "searchDocuments",
    description:
      "Keyword search over earnings call transcripts, filing excerpts and press releases. Use at most 6 keywords.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords to search for." },
        company: {
          type: "string",
          description: "Optional. Restrict the search to one company.",
        },
      },
      required: ["query"],
    },
  },
];

async function searchCompanies(query: string) {
  await sleep(250);
  const needle = String(query).toLowerCase();
  const matches = companies.filter(
    (c) => c.name.toLowerCase().includes(needle) || c.ticker.toLowerCase() === needle,
  );
  return matches.map((c) => ({
    name: c.name,
    ticker: c.ticker,
    sector: c.sector,
  }));
}

async function getCompanyProfile(company: string) {
  await sleep(450);
  return findCompany(company);
}

async function getFinancials(company: string) {
  await sleep(800);
  const match = findCompany(company);
  const record = financials.find((f) => f.company === match.name);
  if (!record) {
    throw new ToolError(`no financials found for "${company}"`);
  }
  const { provenance, ...figures } = record;
  return figures;
}

async function searchDocuments(query: string, company?: string) {
  await sleep(700);

  const terms = String(query).trim().split(/\s+/).filter(Boolean);
  // The upstream document index rejects long queries.
  if (terms.length > 6) {
    throw new ToolError(
      `document search accepts at most 6 terms (received ${terms.length})`,
    );
  }

  const match = company ? findCompany(company) : undefined;
  const pool = match ? documents.filter((d) => d.company === match.name) : documents;

  const scored = pool.map((doc) => {
    const haystack = `${doc.title} ${doc.body}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term.toLowerCase())) score += 1;
    }
    return { doc, score };
  });

  const results = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.doc);

  if (results.length === 0) {
    const scope = match ? ` for ${match.name}` : "";
    return `No documents matched "${query}"${scope}. Try fewer or different keywords.`;
  }
  return results;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "searchCompanies":
      return searchCompanies(input.query as string);
    case "getCompanyProfile":
      return getCompanyProfile(input.company as string);
    case "getFinancials":
      return getFinancials(input.company as string);
    case "searchDocuments":
      return searchDocuments(input.query as string, input.company as string | undefined);
    default:
      throw new ToolError(`unknown tool "${name}"`);
  }
}
