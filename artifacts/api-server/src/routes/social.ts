import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { createHash } from "node:crypto";

const router: IRouter = Router();

type User = {
  userId: string;
  code: string;
  streak: number;
  friends: Set<string>;
};

type Challenge = {
  id: string;
  fromId: string;
  toId: string;
  subject: string;
  yearLevel: string;
  score: number;
  total: number;
  createdAt: number;
  status: "pending" | "beaten" | "failed";
  responderScore?: number;
};

const users = new Map<string, User>();
const codeIndex = new Map<string, string>();
const challenges = new Map<string, Challenge>();

function codeFor(userId: string): string {
  const h = createHash("sha256").update(userId).digest();
  const n = h.readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, "0");
}

function ensureUser(userId: string): User {
  let u = users.get(userId);
  if (!u) {
    const code = codeFor(userId);
    u = { userId, code, streak: 0, friends: new Set() };
    users.set(userId, u);
    codeIndex.set(code, userId);
  }
  return u;
}

async function publicProfile(userId: string) {
  const u = ensureUser(userId);
  let name: string | null = null;
  try {
    const c = await clerkClient.users.getUser(userId);
    name =
      c.firstName ||
      c.username ||
      c.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      null;
  } catch {
    /* ignore */
  }
  return { code: u.code, name, streak: u.streak };
}

router.get("/me", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const me = ensureUser(userId);
  const friends = await Promise.all(
    Array.from(me.friends).map((id) => publicProfile(id)),
  );
  res.json({ code: me.code, streak: me.streak, friends });
});

router.post("/streak", (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const streak = Math.max(0, Math.min(9999, Number(req.body?.streak) || 0));
  const me = ensureUser(userId);
  me.streak = streak;
  res.json({ ok: true, streak: me.streak });
});

router.post("/friends/add", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const code = String(req.body?.code ?? "").replace(/\D/g, "").padStart(6, "0").slice(-6);
  if (code.length !== 6) return res.status(400).json({ error: "Code must be 6 digits" });

  const targetId = codeIndex.get(code);
  if (!targetId)
    return res.status(404).json({ error: "No friend found with that code" });
  if (targetId === userId)
    return res.status(400).json({ error: "That's your own code!" });

  const me = ensureUser(userId);
  const them = ensureUser(targetId);
  me.friends.add(targetId);
  them.friends.add(userId);

  res.json({ ok: true, friend: await publicProfile(targetId) });
});

router.post("/challenges", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const code = String(req.body?.code ?? "").replace(/\D/g, "").slice(-6);
  const subject = String(req.body?.subject ?? "").slice(0, 80);
  const yearLevel = String(req.body?.yearLevel ?? "Year 10").slice(0, 40);
  const score = Math.max(0, Math.min(999, Number(req.body?.score) || 0));
  const total = Math.max(1, Math.min(999, Number(req.body?.total) || 0));
  if (!subject) return res.status(400).json({ error: "Subject required" });

  const targetId = codeIndex.get(code);
  if (!targetId)
    return res.status(404).json({ error: "Friend not found" });
  if (targetId === userId)
    return res.status(400).json({ error: "Can't challenge yourself" });

  const id = createHash("sha256")
    .update(`${userId}:${targetId}:${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 16);
  challenges.set(id, {
    id,
    fromId: userId,
    toId: targetId,
    subject,
    yearLevel,
    score,
    total,
    createdAt: Date.now(),
    status: "pending",
  });
  res.json({ ok: true, id });
});

router.get("/challenges", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const list = Array.from(challenges.values()).filter(
    (c) => c.toId === userId,
  );
  const out = await Promise.all(
    list.map(async (c) => ({
      ...c,
      from: await publicProfile(c.fromId),
    })),
  );
  out.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ challenges: out });
});

router.post("/challenges/:id/result", (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const c = challenges.get(req.params.id);
  if (!c || c.toId !== userId)
    return res.status(404).json({ error: "Not found" });
  const score = Math.max(0, Math.min(999, Number(req.body?.score) || 0));
  c.responderScore = score;
  c.status = score > c.score ? "beaten" : "failed";
  res.json({ ok: true, status: c.status });
});

router.post("/challenges/:id/dismiss", (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const c = challenges.get(req.params.id);
  if (!c || c.toId !== userId)
    return res.status(404).json({ error: "Not found" });
  challenges.delete(req.params.id);
  res.json({ ok: true });
});

router.post("/friends/remove", (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const code = String(req.body?.code ?? "").replace(/\D/g, "").slice(-6);
  const targetId = codeIndex.get(code);
  if (!targetId) return res.status(404).json({ error: "Not found" });
  ensureUser(userId).friends.delete(targetId);
  ensureUser(targetId).friends.delete(userId);
  res.json({ ok: true });
});

export default router;
