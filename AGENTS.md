# AGENTS.md

Instructions I gave the coding agent (Cursor) at the start of the session. I sent them as a chat message rather than a rules file; they're copied here as used.

Context: I'll have to explain every line of this take-home, including code you write. So work with me using these practices:

- Keep changes small and scoped to what I ask. No reformatting, no refactors I didn't ask for, no new dependencies unless you explain why and I agree.
- Before changing something, tell me how we'll check it works (a test, a small script, or a few example questions with expected results).
- After each change, show the diff and explain it in plain words: what changed, why, and what could still go wrong. Flag anything you're unsure about.
- Run the check and the app again after each change. Don't just assume it works.
- Don't swallow errors or hard-code the happy path. Handle failures explicitly.
- Suggest one commit per change, with a message that says why.
- Keep a running log of what I asked for and what I changed or rejected in your output, for my NOTES.md.
- If you noticed something else worth fixing, add it to a "noticed, didn't fix" list instead of fixing it.
- Never commit .env or the API key.