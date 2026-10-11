# After vs. baseline

The after run covers the five README questions (q1–q5) plus two new ones: q6 "What does Wayne Enterprises do?" and q7 "Compare Acme and Globex growth". Baseline is `evals/baseline/` and its `review.md`. Everything below comes from the saved answers, the two server logs and `src/data.ts`.

One run per version, so differences between runs include model variance.

## Steps, tool calls, tool time and tokens

Tool time "sequential" is the sum of all tool calls. "Wall" is the slowest call in each step, added up across steps, which is what the analyst waits for now that calls run in parallel. Baseline ran calls one at a time, so its wall time equals its sequential time. Baseline didn't log tokens.

| Question | Steps (before → after) | Tool calls (before → after) | Failed | Tool time, wall (before → after) | Tool time, sequential after | Tokens in / out after |
|---|---|---|---|---|---|---|
| q1 Acme vs Globex | 2 → 3 | 2 → 6 | 0 | 1.60s → 1.51s | 4.51s | 16,336 / 3,614 |
| q2 Umbrella risks | 4 → 4 | 8 → 6 | 0 | 5.36s → 2.20s | 4.06s | 12,143 / 2,498 |
| q3 Initech transition | 2 → 2 | 3 → 3 | 0 | 1.95s → 0.80s | 1.96s | 6,061 / 2,249 |
| q4 Fastest grower | 2 → 2 | 5 → 5 | 0 | 4.01s → 0.80s | 4.01s | 10,595 / 3,492 |
| q5 GLBX vs ITCH | 2 → 3 | 4 → 7 | 0 | 2.50s → 1.50s | 4.61s | 14,461 / 5,183 |
| q6 Wayne Enterprises | — → 2 | — → 1 | 0 | — → 0.25s | 0.25s | 3,053 / 402 |
| q7 Acme vs Globex growth | — → 2 | — → 3 | 0 | — → 0.80s | 2.40s | 8,240 / 2,667 |

Across q1–q5, wall tool time fell from 15.4s to 6.8s even though tool calls rose from 22 to 27. In q1 and q5 the extra calls are document searches the baseline never made. Two Umbrella searches returned the no-match message ("risk factors" and "cybersecurity data breach litigation"), down from four empty results in the baseline.

## What improved

- **Every answer cites sources.** The baseline cited none. One citation is wrong: q5 attributes the planned divestiture to DOC-GLBX-002, but it's in DOC-GLBX-001.
- **The Umbrella operating-margin conflict is reported** (q2). The answer gives 8.4% from the financials next to the document's 7.4% and says they disagree. This was the top issue in the baseline review.
- **Caveats from the review are now included:**
  - Initech's revenue-recognition review and delayed 10-K (q3 and q5; it was missing from the q5 baseline).
  - The unaudited FY2023 professional services warning (q3).
  - Acme Robotics' guided deceleration to 30–35% and Acme Corp's 4–6% guidance (q1).
  - Globex's 0.6% organic growth versus 2.1% reported (q1 and q5).
- **Numbers the review found wrong are fixed in q5.** FCF margin is 10.7% (was "~10.5%"), "double the operating margin" and "better cash conversion" are gone, and the table labels FY2025 versus FY2024.
- **Contradicted claims are gone.**
  - q1 now quotes DOC-ACME-001 correctly: PLC refresh drove growth and Sensors was flat. The baseline credited "sensor volume growth."
  - q4 drops "accelerated" and "Globex growing in the high single digits."
- **Name handling works.**
  - Tickers resolve directly: q5 calls `getCompanyProfile {"company":"GLBX"}`.
  - Bare "Acme" is flagged as ambiguous, and the answer says which companies it compared (q1, q7).
  - q6 says Wayne Enterprises isn't covered and doesn't answer from memory.
- **The restatement note is gone.** The FY2022 note attached to every company no longer shows up in answers.

## Still wrong

- **The Globex growth conflict isn't reported** (q1, q5). Both answers quote DOC-GLBX-002's "averaged ~1.9%" over three years with the Globex financials in hand. The financials give −2.50%, +3.87% and +2.12%, an average of 1.16%. q5's own table shows a 1.4% CAGR right next to the 1.9%.
- **Causes are given without a document stating them.**
  - q5 says Initech's gross margin rose "as the mix shifts toward higher-margin subscription revenue." Every company's gross margin rises by the same 0.4 points a year, and no document says this.
  - q3 says subscription share is "up from prior years," but no data shows earlier years' mix.
- **q2's explanation of the conflict contradicts its own data.** It suggests the 7.4% "likely refers to Q4 specifically." Umbrella's FY2025 Q4 operating margin in the financials is also 8.36%.
- **q4 still makes no document search.** It keeps "profitability is scaling alongside revenue" against DOC-ACMR-001's *"Operating margin remains thin at roughly 4%"*, and omits the guided slowdown to 30–35%.
- **q5 calls Globex "currently more stable"** without support. Globex had the only revenue decline of the two (FY2023).
- **q2 still treats same-clinic growth (3.1%) as whole-company organic growth.**

## What got worse

- **Two answers claim searches that never happened.** q4 says "I didn't find documents in the search tools explaining the specific drivers," and q7 says "I didn't find any document discussing what's driving these growth differences." The log shows neither ran `searchDocuments`. q7's claim is also false on the facts: DOC-GLBX-001 gives Globex's organic and acquired split. This is new; the "say what you could not get" rule seems to invite it.
- **q7 repeats a fixed error and gets some numbers wrong.**
  - "growth accelerating each year (45–49% YoY)": the actual rates were 45.2%, 48.2%, 52.7% and 47.1%, so it didn't accelerate every year and 52.7% is outside the range.
  - Acme Robotics' CAGR is given as 48.2%; it's 48.27%, which q1 correctly rounds to 48.3%.
  - Acme Corp "~5–6% annually": the yearly rates were 7.3%, 5.7%, 2.6% and 5.5%.
- **q2 opens with reconciliation working instead of the risks.** The first two paragraphs check revenue and margin before the question is answered. It also drops a risk the baseline had: FY2026 guidance relies on acquisitions still under letter of intent (DOC-UMBR-001).
- **Answers are longer and use more calls.** q1 compares both Acme companies, and q5 makes 7 calls instead of 4. Tokens weren't logged in the baseline, so cost can't be compared.

## Verifier on this run

It flagged 4 figures, and none of them is a real error.

- **"$535.6M" and "$105.6M"** (q5): correct FCF figures, flagged because annual FCF dollars had been removed from the candidates. Fixed since this run.
- **"13.4%"** (q3): correct arithmetic, $1.12B / $988M − 1, but guidance-derived figures aren't in the candidate set.
- **"110%"** (q3): from "retention rates above 110%," a rounded bound on 112%.

It passed the real numeric errors in q7: "48.2%" matches Acme Robotics' FY2022–FY2023 growth (48.20%), "49%" matches a 3-year CAGR, and "~5–6%" matches unrelated Acme Corp values. That's the same weakness noted in the review: it doesn't tie a figure to its company, metric or period.
