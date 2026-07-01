import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import { GoogleGenAI } from "@google/genai";
import { createD1Client } from "./d1";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
};

type Variables = {
  user: { username: string; role: string };
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ---------- Password hashing (Web Crypto PBKDF2 — same algorithm/params as
// the old Node implementation, so existing password hashes remain valid) ----------

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: 1000, hash: "SHA-512" },
    keyMaterial,
    512
  );
  return toHex(bits);
}

async function hashPassword(password: string): Promise<string> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2(password, salt);
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hash] = stored.split(":");
  if (!saltHex || !hash) return false;
  const computed = await pbkdf2(password, saltHex);
  return computed === hash;
}

// ---------- DB init / admin seed (runs once per isolate) ----------

let initialized = false;
async function ensureReady(db: D1Database) {
  if (initialized) return;
  const D1Client = createD1Client(db);
  await D1Client.query(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, role TEXT, created_at TEXT
    )`
  );
  await D1Client.query(
    `CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT PRIMARY KEY, data TEXT, updated_at TEXT
    )`
  );
  const res = await D1Client.query("SELECT * FROM users WHERE LOWER(username) = ?", ["admin"]);
  if (res.results.length === 0) {
    const passwordHash = await hashPassword("adminpassword");
    await D1Client.query(
      "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
      ["admin-id-default", "admin", passwordHash, "admin", new Date().toISOString()]
    );
    console.log("Admin user seeded: admin / adminpassword — change this immediately.");
  }
  initialized = true;
}

app.use("*", async (c, next) => {
  await ensureReady(c.env.DB);
  await next();
});

// ---------- Auth middleware ----------

async function requireAuth(c: any, next: any) {
  const token = getCookie(c, "session_token");
  if (!token) return c.json({ error: "Authentication required" }, 401);
  try {
    const decoded = (await verify(token, c.env.JWT_SECRET, "HS256")) as any;
    c.set("user", { username: decoded.username, role: decoded.role });
    await next();
  } catch {
    deleteCookie(c, "session_token");
    return c.json({ error: "Session expired. Please log in again." }, 401);
  }
}

async function requireAdmin(c: any, next: any) {
  return requireAuth(c, async () => {
    if (c.get("user").role !== "admin") {
      return c.json({ error: "Access denied. Admin only." }, 403);
    }
    await next();
  });
}

async function setSessionCookie(c: any, username: string, role: string) {
  const token = await sign(
    { username, role, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
    c.env.JWT_SECRET
  );
  setCookie(c, "session_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

// ---------- Auth routes ----------

app.post("/api/auth/signup", async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const { username, password } = await c.req.json();
    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return c.json({ error: "Username and password are required" }, 400);
    }
    const trimmed = username.trim();
    const cleanUsername = trimmed.toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return c.json({ error: "Username must be between 3 and 20 characters" }, 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return c.json({ error: "Username can only contain letters, numbers, and underscores" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    const checkUser = await D1Client.query("SELECT * FROM users WHERE LOWER(username) = ?", [cleanUsername]);
    if (checkUser.results.length > 0) {
      return c.json({ error: "Username is already taken" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const role = cleanUsername === "admin" ? "admin" : "user";
    const userId = crypto.randomUUID();

    await D1Client.query(
      "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)",
      [userId, trimmed, passwordHash, role, new Date().toISOString()]
    );

    await setSessionCookie(c, trimmed, role);
    return c.json({ username: trimmed, role });
  } catch (err) {
    console.error("Signup error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    const cleanUsername = username.trim().toLowerCase();
    const resUser = await D1Client.query("SELECT * FROM users WHERE LOWER(username) = ?", [cleanUsername]);
    if (resUser.results.length === 0) {
      return c.json({ error: "Invalid username or password" }, 401);
    }
    const userData = resUser.results[0];
    if (!(await verifyPassword(password, userData.password_hash))) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    await setSessionCookie(c, userData.username, userData.role);
    return c.json({ username: userData.username, role: userData.role });
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/auth/logout", (c) => {
  deleteCookie(c, "session_token");
  return c.json({ success: true });
});

app.get("/api/auth/me", async (c) => {
  const token = getCookie(c, "session_token");
  if (!token) return c.json({ error: "Not logged in" }, 401);
  try {
    const decoded = (await verify(token, c.env.JWT_SECRET, "HS256")) as any;
    return c.json({ username: decoded.username, role: decoded.role });
  } catch {
    deleteCookie(c, "session_token");
    return c.json({ error: "Session expired" }, 401);
  }
});

// ---------- Progress sync ----------

app.get("/api/progress", requireAuth, async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const cleanUsername = c.get("user").username.toLowerCase();
    const result = await D1Client.query("SELECT data FROM progress WHERE user_id = ?", [cleanUsername]);
    if (result.results.length > 0) {
      try {
        return c.json(JSON.parse(result.results[0].data));
      } catch {
        return c.json({});
      }
    }
    return c.json({});
  } catch (err) {
    console.error("Get progress error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/progress", requireAuth, async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const cleanUsername = c.get("user").username.toLowerCase();
    const body = await c.req.json();
    const bodyStr = JSON.stringify(body);
    const now = new Date().toISOString();
    await D1Client.query(
      "INSERT INTO progress (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?",
      [cleanUsername, bodyStr, now, bodyStr, now]
    );
    return c.json({ success: true });
  } catch (err) {
    console.error("Save progress error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ---------- Translation ----------

app.post("/api/translate", async (c) => {
  let text = "";
  try {
    const body = await c.req.json();
    text = body.text;
    const targetLanguage = body.targetLanguage;
    if (!text || !targetLanguage) {
      return c.json({ error: "Text and targetLanguage are required." }, 400);
    }
    if (targetLanguage === "English") {
      return c.json({ translation: text });
    }

    const ai = new GoogleGenAI({
      apiKey: c.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const prompt = `You are a high-fidelity translator for an immersive language learning game.
Translate the following English conversational dialogue sentence into highly natural, conversational, and contextually accurate ${targetLanguage} spoken phrasing.
Do not explain the translation, do not use quotes, and do not provide multiple options. Output ONLY the translated sentence.

Sentence: "${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { temperature: 0.2 },
    });

    return c.json({ translation: response.text?.trim() || text });
  } catch (err) {
    console.error("Translation API error:", err);
    return c.json({ translation: text || "" });
  }
});

// ---------- Admin ----------

app.get("/api/admin/users", requireAdmin, async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const resUsers = await D1Client.query("SELECT username, role, created_at FROM users");
    return c.json(
      resUsers.results.map((u: any) => ({ username: u.username, role: u.role, createdAt: u.created_at }))
    );
  } catch (err) {
    console.error("Get users error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/admin/reset-password", requireAdmin, async (c) => {
  const D1Client = createD1Client(c.env.DB);
  try {
    const { targetUsername, newPassword } = await c.req.json();
    if (!targetUsername || !newPassword) {
      return c.json({ error: "Target username and new password are required" }, 400);
    }
    const cleanUsername = targetUsername.trim().toLowerCase();
    const resUser = await D1Client.query("SELECT * FROM users WHERE LOWER(username) = ?", [cleanUsername]);
    if (resUser.results.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }
    const passwordHash = await hashPassword(newPassword);
    await D1Client.query("UPDATE users SET password_hash = ? WHERE LOWER(username) = ?", [
      passwordHash,
      cleanUsername,
    ]);
    return c.json({ success: true, message: `Password for user ${targetUsername} has been reset` });
  } catch (err) {
    console.error("Reset password error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Static assets (the Vite-built frontend) and SPA fallback are handled
// automatically by the "assets" config in wrangler.jsonc — nothing to add here.

export default app;
