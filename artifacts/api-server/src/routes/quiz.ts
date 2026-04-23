import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM = `You are EduMind's quiz writer. You generate clear, accurate multiple-choice questions appropriate for the requested subject and year level.
You always reply with STRICT JSON ONLY — no prose, no markdown fences. Schema:
{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0}]}
Rules:
- Exactly 4 options per question.
- "answer" is the 0-based index of the correct option.
- Make options plausible; avoid "all/none of the above".
- Vary question style (recall, reasoning, application).
- Keep questions self-contained.`;

router.post("/quiz", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const subject = String(req.body?.subject ?? "General Knowledge").slice(0, 80);
  const yearLevel = String(req.body?.yearLevel ?? "Year 10").slice(0, 40);
  const count = Math.max(3, Math.min(10, Number(req.body?.count) || 5));

  const userPrompt = `Generate ${count} multiple-choice questions on "${subject}" for a ${yearLevel} student. Return JSON only.`;

  try {
    const result = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = result.content[0];
    const text = block && block.type === "text" ? block.text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Model did not return JSON");
    const parsed = JSON.parse(jsonMatch[0]) as {
      questions?: { q: string; options: string[]; answer: number }[];
    };
    const questions = (parsed.questions || []).filter(
      (q) =>
        q &&
        typeof q.q === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < 4,
    );
    if (questions.length === 0) throw new Error("No valid questions returned");
    res.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quiz generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
