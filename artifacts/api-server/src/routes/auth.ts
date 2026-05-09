import bcrypt from "bcryptjs";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, facultyUsers } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  clearSession,
  createSession,
  getSessionId,
  setSessionCookie,
} from "../lib/auth";

const router: IRouter = Router();

function validateLogin(body: unknown): { username: string; password: string } | null {
  if (!body || typeof body !== "object") return null;
  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== "string" || !username.trim()) return null;
  if (typeof password !== "string" || !password) return null;
  return { username: username.trim().toLowerCase(), password };
}

function validateSetup(body: unknown): { username: string; password: string; name: string } | null {
  if (!body || typeof body !== "object") return null;
  const { username, password, name } = body as Record<string, unknown>;
  if (typeof username !== "string" || username.trim().length < 3) return null;
  if (typeof password !== "string" || password.length < 6) return null;
  if (typeof name !== "string" || !name.trim()) return null;
  return { username: username.trim().toLowerCase(), password, name: name.trim() };
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json({ user: req.isAuthenticated() ? req.user : null });
});

router.get("/auth/setup-status", async (_req: Request, res: Response) => {
  const [{ value }] = await db.select({ value: count() }).from(facultyUsers);
  res.json({ needsSetup: Number(value) === 0 });
});

router.post("/auth/setup", async (req: Request, res: Response) => {
  const [{ value }] = await db.select({ value: count() }).from(facultyUsers);
  if (Number(value) > 0) {
    res.status(400).json({ error: "Setup already completed. Please log in." });
    return;
  }

  const parsed = validateSetup(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Name and username (min 3 chars) and password (min 6 chars) are required" });
    return;
  }

  const { username, password, name } = parsed;
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(facultyUsers)
    .values({ username, passwordHash, name, role: "admin" })
    .returning();

  const sid = await createSession({
    user: {
      id: String(user.id),
      email: user.username,
      firstName: user.name,
      lastName: null,
      profileImageUrl: null,
    },
  });
  setSessionCookie(res, sid);
  res.json({ ok: true, username: user.username, name: user.name, role: user.role });
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = validateLogin(req.body);
  if (!parsed) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const { username, password } = parsed;

  const [user] = await db
    .select()
    .from(facultyUsers)
    .where(eq(facultyUsers.username, username));

  if (!user) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const sid = await createSession({
    user: {
      id: String(user.id),
      email: user.username,
      firstName: user.name,
      lastName: null,
      profileImageUrl: null,
    },
  });
  setSessionCookie(res, sid);
  res.json({ ok: true, username: user.username, name: user.name, role: user.role });
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json({ ok: true });
});

export default router;
