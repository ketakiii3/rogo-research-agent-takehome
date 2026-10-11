# Notes

I focused on agent behavior and on proving the changes with tests and evals.

## How I approached it
- Ran the 5 README questions on the original code first and saved the answers and logs (`evals/baseline/`).
- Surprise: the numbers were almost all right. The real problems were no citations, reasons the documents don't say, missing caveats, wrong comparisons built from correct numbers, and one number that conflicts between the financials and a document (Umbrella's margin).
- So I focused on trust: make the agent fail clearly instead of guessing, and stick to its sources.

## What I changed
- `agent.ts`: tool failures are marked as errors; if there's no draft, it returns a fixed message directly instead of sending it through the editor; the editor only sees the draft now, and if it returns nothing, the draft is used.
- `tools.ts`: company lookup accepts tickers, case and name variants; ambiguous names like "Acme" return both options; empty document searches say so instead of returning `[]`.
- `agent.ts` prompts: cite every figure, search documents before giving causes, report conflicts between sources, keep caveats. Coverage list trimmed to names and tickers so the model uses tools. Editor told not to touch numbers, citations or caveats.
- `verifier.ts` (new): code-only check that every $ and % in the answer exists in the data for the companies it names. Logs the result and returns it in the API response; the UI doesn't show it yet. No model call.
- `agent.ts` / `tools.ts`: tool calls in a step run in parallel; financials no longer include provenance noise; token usage is logged per question.

## Results (`evals/after/`)
- Every answer with figures now cites sources (one citation is wrong); the Umbrella conflict is reported; most missing caveats are back (q4 still omits Acme Robotics' guided slowdown); Wayne Enterprises is declined.
- Tool wait time for the 5 questions: 15.4s → 6.8s (tool time only; calls went 22 → 27).
- 19 tests, no API key needed.
- Still wrong: q4 and q7 skip the document search but say no document was found; q5 still gives a cause no document states; the Globex 1.9% vs 1.16% conflict isn't reported (the source data itself disagrees there).

## Things I decided against
- Rejected a refactor the AI made (moving the tool loop into tools.ts) and kept the change small, so parallel calls are checked only from the log.
- Kept the editor but limited what it sees, instead of removing it.

## Known limitations
- The verifier checks that a number exists, not that it's the right year or metric. "Both" can be a coincidence (Umbrella's 7.4% matches FY2021), whole-number percentages are weakly checked, and on the rerun it caught no real errors and missed q7's.
- I first trimmed the verifier to fit the baseline answers, and it then flagged real FCF figures in new answers. I added annual FCF back; two other trimmed kinds are still out. The lesson: don't tune a checker on one set of examples.
- The `agent.ts` changes (error flag, fallbacks, parallel calls, token logging) have no offline tests; they were checked by the live rerun only.
- One run each, before and after; some differences may be model variance. The baseline didn't log tokens, so there's no cost comparison.

## Next steps
- An LLM judge for claims and for whether the document search actually happened.
- Match each figure to its company, year and metric.
- Show verification in the UI; run the baseline questions as an eval in CI.