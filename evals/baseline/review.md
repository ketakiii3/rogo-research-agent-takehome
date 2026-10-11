# Baseline review

Review of the five README questions run against the original code. Answers are in `q1.txt`–`q5.txt` and the server log is in `server-log.txt`.

## Bottom line

Almost every individual \$ and % figure in the five answers traces back to `src/data.ts`. The problems are elsewhere:

- **One number conflicts with the data.** Umbrella Health's operating margin is quoted from a document that disagrees with the financials data, and the answer doesn't say so.
- **Some conclusions rest on claims the data contradicts.** The worst are the cash-conversion and "resilience" arguments in the Globex-vs-Initech answer and "growth accelerated" for Acme Robotics.
- **Material caveats were dropped.** The biggest is Initech's revenue-recognition review in the "better business" answer.
- **Nothing is sourced.** No answer cites a document ID.
- **Tools always run one at a time.** That cost about 10 seconds across the five questions, and no call failed.

I recomputed every figure by running the data generator itself, and replayed every document search from the log. One limit: the log doesn't record the draft, so I can't tell which errors came from the research model and which the editor added.

A property of the mock data affects several findings. Gross margin rises exactly 0.4 points a year for every company, and operating margin rises 0.24 points a year. Net income is always 0.74 × operating income, and free cash flow (FCF) is always 0.61 × operating income. So any story that explains one company's margin trend, or claims one company converts cash better than another, is unsupported by construction.

## Numbers

Every figure not listed below matches the data, including all the compound annual growth rates (CAGRs), year-over-year rates and revenue series.

**Acme vs Globex**
- "The gap widened further in FY2025": this is contradicted. The 4-year net-income CAGRs are 7.47% vs 4.04%, a gap of 3.43 points (1.85×). FY2025 growth was 7.62% vs 4.66%, a gap of 2.96 points (1.64×). The gap narrowed.
- "Globex's margin is… improving more slowly": also contradicted. Acme went from 38.1% to 39.7% and Globex from 29.2% to 30.8%, the same +1.6 points.
- "Acme wins on every growth metric": false for FY2024. Globex grew revenue 3.87% vs Acme's 2.63%, and net income 6.54% vs 4.71%.

**Umbrella Health risks**
- "Operating margin slipped 20 basis points to 7.4%" traces to DOC-UMBR-001. But the financials data says FY2025 operating margin was 367.4 / 4,395 = **8.36%**, up from 325.6 / 4,010 = 8.12%. That's +24 basis points, not −20. This run never called `getFinancials`, so the conflict never surfaced.

**Fastest grower**
- "Growth has… even accelerated: 45%, 48%, 53%, 47%": the figures are right, but FY2025 decelerated from 52.7% to 47.1%.
- "Globex and Umbrella Health… growing in the high single digits": contradicted for Globex by the answer's own table, which shows ~1% CAGR and ~2% for the latest year.

**Globex vs Initech**
- "Double the operating margin": 17.52% / 9.86% = **1.78×**.
- FCF margin "~10.5%" for Initech: FY2024 is 105.6 / 988 = 10.69%.
- Globex operating margin "~9.8–9.9%" matches FY2025 only (FY2024 is 9.62%). The table puts Initech's FY2024 next to Globex's FY2025.
- "Much better… cash conversion than GLBX": contradicted. FCF ÷ operating income is 535.6 / 878 = 0.61 for Globex and 105.6 / 173.1 = 0.61 for Initech, identical. DOC-GLBX-001 also says *"Free cash flow conversion improved to 61% of operating income."*

The data file also disagrees with itself in two places the answers didn't touch:
- DOC-ACMR-001 says operating margin is *"roughly 4%"*, but the data gives 51.4 / 1,015 = 5.06%.
- DOC-GLBX-002 says growth *"averaged approximately 1.9% annually"* over three years. The yearly rates were −2.50%, +3.87% and +2.12%, which average 1.16%.

## Claims checked against the documents

**Acme vs Globex** (no document search was run, so the model never saw these documents)
- "Gross margin… reflecting operating leverage from sensor and PLC volume growth" is contradicted. DOC-ACME-001 says *"Sensors and Instrumentation was roughly flat on soft automotive demand"* and that gross margin *"expanded 40 basis points on favorable mix and the Cleveland plant consolidation."*
- "Meaningful FX drag from its international mix" matches DOC-GLBX-002 (*"drag from currency translation on our European operations"*), but that document wasn't retrieved, so the claim came from the model's own background knowledge.
- "Growth diluted by scale, cyclicality, international exposure" is unsupported. DOC-GLBX-002 gives *"mature end markets"* and *"capital allocation priority is margin expansion rather than top-line growth."*
- Omitted, and it would strengthen the conclusion: DOC-GLBX-001 says *"Organic growth was approximately 0.6%, with the balance from the two bolt-on acquisitions."*

**Umbrella Health**
- "Organic (same-clinic) growth was just 3.1%" mixes two things. Same-clinic growth is a Clinic Operations metric, and the 3.1% figure for whole-company organic growth comes from 9.6 − 6.5. It happens to match.
- "Medicare/Medicaid" isn't in any document, which only says *"government reimbursement rates."* "Ongoing headwinds rather than one-time hits" is opinion.
- The offer to "check the FY2024 10-K" can't be fulfilled: that filing is listed but no document for it exists.

**Initech subscription transition**
- "Gross margin… tracks with subscription's richer margins" is unsupported. Every company's gross margin rises the same 0.4 points a year.
- It presents the FY2022 restatement as an Initech issue. That note is attached to every company's record.
- It dropped the `getFinancials` warning *"FY2023 professional services revenue is unaudited."*
- "Going well overall" plays down DOC-ITCH-002: *"The principal risk to our plan remains the pace at which existing perpetual customers convert."*

**Fastest grower**
- "Profitability is scaling right alongside revenue" is contradicted. DOC-ACMR-001 says *"Operating margin remains thin at roughly 4%… we expect that to stay the case through FY2026."* DOC-ACMR-002 says the new pricing tiers *"will modestly dilute hardware gross margin."*
- Omitted: *"We are guiding FY2026 growth of 30 to 35 percent, a deliberate deceleration."*
- "Small, early-stage" is unsupported. The company was founded in 2014, has \$1B+ in revenue and is past its IPO.

**Globex vs Initech** (no document search was run)
- "Switching costs are high," "low cost to serve each incremental customer" and "capital-intensive" appear in no tool output. There's no capex data at all.
- "GLBX is… more resilient" is contradicted by the data: Globex is the only one of the two whose revenue fell (FY2023, −2.5%).
- The biggest omission: DOC-ITCH-001 says the 10-K is *"delayed… as it completes the review of revenue recognition for a set of multi-year contracts"* and that results *"may differ materially."* That bears directly on a "better business" call, and the model never searched for it.

## Sources

No answer cites a document ID or says where any figure came from. Two answers name document types in passing:
- The Umbrella answer mentions "FY2025 10-K and earnings call."
- The Initech answer mentions "the Jan 30, 2026 8-K" and quotes "may differ materially."

The tables in the Acme/Globex, fastest-grower and Globex/Initech answers have no source. The financials' own source tag (`internal-fundamentals-warehouse`) is never mentioned.

## From the log

None of the 22 calls failed: the server prints a `!` line for each failure and there are none. "Steps" counts the research model's calls; each question also had one editor call, which isn't logged.

| Question | Steps | Tool calls | Failed | Empty results | Tool time, one at a time | If each step ran in parallel |
|---|---|---|---|---|---|---|
| Acme vs Globex | 2 | 2 | 0 | 0 | 1.60s | 0.80s |
| Umbrella risks | 4 | 8 | 0 | 4 | 5.36s | 2.11s |
| Initech transition | 2 | 3 | 0 | 0 | 1.95s | 0.80s |
| Fastest grower | 2 | 5 | 0 | 0 | 4.01s | 0.80s |
| GLBX vs ITCH | 2 | 4 | 0 | 0 | 2.50s | 0.80s |

Across all five, the tools took 15.4s running one after another, versus about 5.3s if each step's calls had run in parallel. That's roughly 10s of avoidable waiting.

In the Umbrella question, four searches returned `[]`: "risk factors," "risk," "goodwill impairment leverage debt," and "cybersecurity data privacy HIPAA." That's another 2.8s spent on searches that couldn't match, because only two Umbrella documents exist and neither contains the word "risk."

## Ranked by impact on an analyst acting on these answers

1. **An undisclosed conflict on a headline number.** Umbrella's operating margin is reported as 7.4% and down, while the financials data says 8.36% and up. Someone modeling margins could go either way and wouldn't know there was a disagreement.
2. **Contradicted claims behind conclusions.** In the Globex-vs-Initech answer: "better cash conversion" (identical), "double the operating margin" (1.78×), and "GLBX more resilient" (it's the one whose revenue fell). In the fastest-grower answer: "accelerated" and "profitability scaling," and Globex "high single digits."
3. **Material caveats left out.** Initech's revenue-recognition review in the "better business" answer; Acme Robotics' guided slowdown to 30–35% in the fastest-grower answer; Globex's 0.6% organic growth; and Initech's unaudited-revenue warning in the subscription answer.
4. **No sourcing anywhere.** This turns every problem above from catchable into invisible, because the analyst can't trace any claim.
5. **Claims with no retrieval behind them.** In the Acme/Globex and Globex/Initech answers, document-style reasoning (FX drag, switching costs, capital intensity) appears even though no document was searched. Some of it happens to match the documents, which makes it harder to spot.
6. **Smaller contradicted descriptions in the Acme/Globex answer.** "Gap widened," "margin improving more slowly," and the claimed cause of the margin gains. The conclusion that Acme is growing faster still holds.
7. **Latency.** About 10s lost to running tools one at a time, plus 2.8s of searches that couldn't match.
8. **Rounding slips.** The 10.5% vs 10.7% FCF margin, and mixed FY2024/FY2025 comparisons in one table.
