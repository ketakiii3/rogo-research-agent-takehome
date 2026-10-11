import "dotenv/config";
import express from "express";
import { runAgent } from "./agent.ts";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\nANTHROPIC_API_KEY is not set.\nCopy .env.example to .env and add your key, then run `npm run dev` again.\n",
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const message = String(req.body.message ?? "");
  console.log(`\n[chat] ${message}`);

  try {
    const result = await runAgent(message, (event) => {
      switch (event.type) {
        case "iteration":
          console.log(`[agent] iteration ${event.n}`);
          break;
        case "tool_start":
          console.log(`[tool]  → ${event.name} ${JSON.stringify(event.input)}`);
          break;
        case "tool_end":
          console.log(`[tool]  ← ${event.name} (${event.ms}ms)`);
          break;
        case "tool_failed":
          console.log(`[tool]  ! ${event.name}: ${event.message}`);
          break;
      }
    });

    console.log(
      `[usage] ${result.usage.inputTokens} input tokens, ${result.usage.outputTokens} output tokens`,
    );
    const { figures } = result.verification;
    const notFound = figures.filter((f) => f.status === "not found");
    const unchecked = figures.filter((f) => f.status === "unchecked").length;
    console.log(
      `[verify] ${figures.length} figures, ${notFound.length} not found` +
        (notFound.length ? `: ${notFound.map((f) => f.text).join(", ")}` : "") +
        (unchecked ? `, ${unchecked} unchecked (no company named)` : ""),
    );
    res.json({ answer: result.answer, verification: result.verification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Agent server listening on http://localhost:${port}`);
});
