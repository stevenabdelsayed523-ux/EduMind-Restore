import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

const client = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const SYSTEM = `You are EduMind, a friendly study tutor for students from primary school through university.
Explain clearly, use short paragraphs, give worked examples when helpful, and end with one quick check-for-understanding question when relevant.
Keep answers concise (under 250 words) unless the user asks for more depth.`;

router.post("/chat", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!messages) return res.status(400).json({ error: "messages required" });

  try {
    const result = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      system: SYSTEM,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
    });
    const block = result.content[0];
    const text = block && block.type === "text" ? block.text : "";
    res.json({ content: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    res.status(500).json({ error: message });
  }
});

export default router;
