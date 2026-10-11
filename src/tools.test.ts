import { describe, expect, it } from "vitest";
import { executeTool, findCompany } from "./tools.ts";

describe("findCompany", () => {
  it("resolves a ticker", () => {
    expect(findCompany("GLBX").name).toBe("Globex Inc");
  });

  it("resolves a name regardless of case", () => {
    expect(findCompany("acme corp").name).toBe("Acme Corp");
  });

  it("resolves a partial name with a single match", () => {
    expect(findCompany("Globex").name).toBe("Globex Inc");
  });

  it("resolves an input that contains the full name", () => {
    expect(findCompany("Globex Inc.").name).toBe("Globex Inc");
    expect(findCompany("Acme Corporation").name).toBe("Acme Corp");
    expect(findCompany("Initech Corp").name).toBe("Initech");
  });

  it("throws on an ambiguous name, listing every candidate", () => {
    expect(() => findCompany("Acme")).toThrow(/Acme Corp \(ACME\)/);
    expect(() => findCompany("Acme")).toThrow(/Acme Robotics \(ACMR\)/);
  });

  it("throws for a company outside the coverage universe", () => {
    expect(() => findCompany("Wayne Enterprises")).toThrow(/not in our coverage universe/);
  });
});

describe("getFinancials", () => {
  it("returns figures and warnings but not provenance", async () => {
    const record = (await executeTool("getFinancials", { company: "Initech" })) as Record<
      string,
      unknown
    >;
    expect(record).not.toHaveProperty("provenance");
    expect(record.warnings).toContain(
      "FY2025 has not been filed yet; the 8-K dated 2026-01-30 gives preliminary revenue guidance only.",
    );
    expect(record).toHaveProperty("annual");
  });
});
