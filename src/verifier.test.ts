import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { verifyAnswer } from "./verifier.ts";

const statusOf = (answer: string) =>
  verifyAnswer(answer).figures.map((f) => [f.text, f.status]);

describe("verifyAnswer: planted figures", () => {
  it("confirms a figure that both the financials and a document support", () => {
    expect(statusOf("Acme Corp revenue was $2.26B, up 5.5% year over year.")).toEqual([
      ["$2.26B", "both"],
      ["5.5%", "both"],
    ]);
  });

  it("flags a revenue figure that matches nothing", () => {
    expect(statusOf("Acme Corp revenue was $2.31B.")).toEqual([["$2.31B", "not found"]]);
  });

  it("only checks the companies the answer names", () => {
    expect(statusOf("Acme Corp revenue was $2.4B.")).toEqual([["$2.4B", "not found"]]);
    // Globex FY2023 Q4 revenue is $2,417.8M, so the same figure is found once Globex is named.
    expect(statusOf("Globex Inc quarterly revenue reached $2.4B.")).toEqual([
      ["$2.4B", "one source"],
    ]);
  });

  it("does not accept a point inside a guided range", () => {
    expect(statusOf("Initech FY2025 revenue was $1.13B.")).toEqual([["$1.13B", "not found"]]);
    expect(statusOf("Initech guided FY2025 revenue of $1.12–1.14B.")).toEqual([
      ["$1.12B", "one source"],
      ["$1.14B", "one source"],
    ]);
  });

  it("matches to the precision written", () => {
    // Initech FY2021–FY2024 revenue CAGR is 15.57%.
    expect(statusOf("Initech grew at a ~16% CAGR.")).toEqual([["16%", "one source"]]);
    expect(statusOf("Initech grew at a 15.6% CAGR.")).toEqual([["15.6%", "one source"]]);
    expect(statusOf("Initech grew at a 15.5% CAGR.")).toEqual([["15.5%", "not found"]]);
  });

  it("marks figures unchecked when the answer names no company", () => {
    expect(statusOf("Revenue was $2.26B.")).toEqual([["$2.26B", "unchecked"]]);
  });
});

const baseline = (n: number) =>
  readFileSync(new URL(`../evals/baseline/q${n}.txt`, import.meta.url), "utf8");

const flagged = (answer: string) =>
  verifyAnswer(answer)
    .figures.filter((f) => f.status === "not found")
    .map((f) => f.text);

describe("verifyAnswer: baseline answers", () => {
  it.each([
    [1, []],
    [2, []],
    // "each about 14–16% higher": yearly growth was 15.94%, 16.04% and 14.75%, so the low end is 15%.
    [3, ["14%"]],
    [4, []],
    // "~9.8–9.9%" operating margin: Globex FY2025 is 9.86% and FY2024 is 9.62%, so nothing is 9.8%.
    [5, ["9.8%"]],
  ])("q%i flags exactly the expected figures", (n, expected) => {
    expect(flagged(baseline(n))).toEqual(expected);
  });
});
