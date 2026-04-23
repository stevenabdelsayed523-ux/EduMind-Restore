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

const users = new Map<string, User>();
const codeIndex = new Map<string, string>();

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
