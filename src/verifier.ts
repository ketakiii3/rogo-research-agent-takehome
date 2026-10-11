/**
 * Code-only check of the final answer: every $ and % figure is tested against
 * data.ts for the companies the answer names. No model calls.
 */

import { companies, documents, financials, type Company } from "./data.ts";

/** "unchecked" means the answer named no company, so there was nothing to check against. */
export type FigureStatus = "both" | "one source" | "not found" | "unchecked";

export interface CheckedFigure {
  /** The figure as written, one per range endpoint, e.g. "$1.12B" or "16%". */
  text: string;
  unit: "$M" | "%";
  value: number;
  status: FigureStatus;
  sources: string[];
}

export interface Verification {
  companies: string[];
  figures: CheckedFigure[];
}

interface Figure {
  text: string;
  unit: "$M" | "%";
  value: number;
  /** Half of the last written digit, in the figure's unit. */
  tolerance: number;
}

const DOLLAR_SCALE: Record<string, number> = {
  b: 1000,
  bn: 1000,
  billion: 1000,
  m: 1,
  million: 1,
};

const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
const DOLLAR_RE = new RegExp(
  String.raw`\$(${NUM})(?:\s?[–-]\s?\$?(${NUM}))?\s?(billion|million|bn|B|M)?\b`,
  "gi",
);
const PERCENT_RE = new RegExp(
  String.raw`(?<![\w.$])(${NUM})(?:\s?(?:[–-]|to)\s?(${NUM}))?\s?(?:%|percent\b)`,
  "gi",
);

function parseNumber(raw: string): { value: number; decimals: number } {
  const clean = raw.replace(/,/g, "");
  return { value: Number(clean), decimals: clean.split(".")[1]?.length ?? 0 };
}

/** Extracts every $ and % figure, splitting ranges into their endpoints. */
export function extractFigures(text: string): Figure[] {
  const found: { index: number; figure: Figure }[] = [];

  for (const m of text.matchAll(DOLLAR_RE)) {
    const unitWord = m[3] ?? "M";
    const scale = DOLLAR_SCALE[unitWord.toLowerCase()];
    for (const raw of [m[1], m[2]].filter(Boolean)) {
      const { value, decimals } = parseNumber(raw);
      found.push({
        index: m.index,
        figure: {
          text: `$${raw}${m[3] ?? ""}`,
          unit: "$M",
          value: value * scale,
          tolerance: 0.5 * 10 ** -decimals * scale,
        },
      });
    }
  }

  for (const m of text.matchAll(PERCENT_RE)) {
    const ends = [m[1], m[2]].filter(Boolean);
    // "in 2024 to 15%" is not a range.
    if (ends.length === 2 && parseNumber(ends[1]).value < parseNumber(ends[0]).value) ends.shift();
    for (const raw of ends) {
      const { value, decimals } = parseNumber(raw);
      found.push({
        index: m.index,
        figure: { text: `${raw}%`, unit: "%", value, tolerance: 0.5 * 10 ** -decimals },
      });
    }
  }

  return found.sort((a, b) => a.index - b.index).map((f) => f.figure);
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Companies the answer names by full name, ticker, or a first word no other company shares. */
export function namedCompanies(text: string): Company[] {
  return companies.filter((c) => {
    const first = c.name.split(" ")[0];
    const firstIsUnique = companies.filter((o) => o.name.split(" ")[0] === first).length === 1;
    return (
      new RegExp(`\\b${escape(c.name)}\\b`, "i").test(text) ||
      new RegExp(`\\b${escape(c.ticker)}\\b`).test(text) ||
      (firstIsUnique && new RegExp(`\\b${escape(first)}\\b`).test(text))
    );
  });
}

interface Candidate {
  unit: "$M" | "%";
  value: number;
  source: string;
  fromDocument: boolean;
}

const pct = (ratio: number) => ratio * 100;

/** Every value an analyst could state or compute from the structured data for one company. */
function structuredCandidates(company: Company): Candidate[] {
  const out: Candidate[] = [];
  const add = (unit: "$M" | "%", value: number, source: string) =>
    out.push({ unit, value, source, fromDocument: false });

  for (const s of company.segments) {
    add("%", pct(s.shareOfRevenue), `profile: ${company.name} ${s.name} share of revenue`);
  }

  const record = financials.find((f) => f.company === company.name);
  if (!record) return out;
  const tag = `financials: ${company.name}`;

  const years = record.annual.filter((y) => y.revenue !== null);
  const metrics = ["revenue", "operatingIncome", "netIncome", "freeCashFlow"] as const;

  for (const y of years) {
    const fy = `FY${y.fiscalYear}`;
    const revenue = y.revenue!;
    add("$M", revenue, `${tag} ${fy} revenue`);
    add("$M", y.operatingIncome!, `${tag} ${fy} operatingIncome`);
    add("$M", y.netIncome!, `${tag} ${fy} netIncome`);
    add("$M", y.freeCashFlow!, `${tag} ${fy} freeCashFlow`);
    add("%", pct(y.grossMargin!), `${tag} ${fy} gross margin`);
    add("%", pct(y.operatingIncome! / revenue), `${tag} ${fy} operating margin`);
    add("%", pct(y.netIncome! / revenue), `${tag} ${fy} net margin`);
    add("%", pct(y.freeCashFlow! / revenue), `${tag} ${fy} FCF margin`);
  }

  for (let i = 0; i < years.length; i++) {
    for (let j = i + 1; j < years.length; j++) {
      const [a, b] = [years[i], years[j]];
      const span = b.fiscalYear - a.fiscalYear;
      const range = `FY${a.fiscalYear}–FY${b.fiscalYear}`;
      for (const m of metrics) {
        const ratio = b[m]! / a[m]!;
        add("%", pct(ratio - 1), `${tag} ${range} ${m} change`);
        if (span > 1) add("%", pct(ratio ** (1 / span) - 1), `${tag} ${range} ${m} CAGR`);
      }
    }
  }

  for (const q of record.quarterly) {
    add("$M", q.revenue, `${tag} ${q.period} revenue`);
    add("%", pct(q.grossMargin), `${tag} ${q.period} gross margin`);
    add("%", pct(q.operatingIncome / q.revenue), `${tag} ${q.period} operating margin`);
  }

  return out;
}

function documentCandidates(company: Company): Candidate[] {
  return documents
    .filter((d) => d.company === company.name)
    .flatMap((d) =>
      extractFigures(d.body).map((f) => ({
        unit: f.unit,
        value: f.value,
        source: d.id,
        fromDocument: true,
      })),
    );
}

const EPSILON = 1e-9;

export function verifyAnswer(answer: string): Verification {
  const named = namedCompanies(answer);
  const candidates = named.flatMap((c) => [...structuredCandidates(c), ...documentCandidates(c)]);

  const figures = extractFigures(answer).map((f): CheckedFigure => {
    const matches = candidates.filter(
      (c) =>
        c.unit === f.unit &&
        Math.abs(Math.abs(c.value) - f.value) <= f.tolerance + EPSILON,
    );
    const inData = matches.some((c) => !c.fromDocument);
    const inDocs = matches.some((c) => c.fromDocument);
    const status: FigureStatus =
      named.length === 0
        ? "unchecked"
        : inData && inDocs
          ? "both"
          : inData || inDocs
            ? "one source"
            : "not found";
    return {
      text: f.text,
      unit: f.unit,
      value: f.value,
      status,
      sources: [...new Set(matches.map((c) => c.source))],
    };
  });

  return { companies: named.map((c) => c.name), figures };
}
