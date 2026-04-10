import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
const sessionSecret = process.env.SESSION_SECRET || "change-me-in-production";
const sessionCookieName = "admin_session";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDir));

type GamePayload = {
  name?: string;
  coverImage?: string;
  cloudLink?: string;
  genre?: string;
  platform?: string;
  summary?: string;
  sortOrder?: number;
};

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(handler: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function parseCookies(cookieHeader?: string) {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      continue;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join("="));
  }

  return cookies;
}

function signSessionValue(value: string) {
  return crypto.createHmac("sha256", sessionSecret).update(value).digest("hex");
}

function createSessionToken(username: string) {
  const payload = `${username}.${Date.now()}`;
  const signature = signSessionValue(payload);
  return `${payload}.${signature}`;
}

function readSessionUser(req: Request) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 3) {
    return null;
  }

  const signature = parts.pop();
  const payload = parts.join(".");
  const expectedSignature = signSessionValue(payload);

  if (!signature || signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const [username] = payload.split(".");
  return username === adminUsername ? username : null;
}

function setSessionCookie(res: Response, username: string) {
  const token = createSessionToken(username);
  const isProduction = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${isProduction ? "; Secure" : ""}`
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const username = readSessionUser(req);

  if (!username) {
    res.status(401).json({ message: "请先登录管理端" });
    return;
  }

  next();
}

function normalizePayload(payload: GamePayload) {
  const name = payload.name?.trim();
  const coverImage = payload.coverImage?.trim();
  const cloudLink = payload.cloudLink?.trim();

  if (!name || !coverImage || !cloudLink) {
    return { error: "name、coverImage、cloudLink 为必填项" };
  }

  return {
    data: {
      name,
      cover_image: coverImage,
      cloud_link: cloudLink,
      genre: payload.genre?.trim() || "",
      platform: payload.platform?.trim() || "",
      summary: payload.summary?.trim() || "",
      sort_order: Number(payload.sortOrder || 0)
    }
  };
}

app.get("/api/health", asyncHandler(async (_req: Request, res: Response) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
}));

app.get("/api/admin/me", (req: Request, res: Response) => {
  const username = readSessionUser(req);

  if (!username) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({ authenticated: true, username });
});

app.post("/api/admin/login", (req: Request, res: Response) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ message: "账号或密码错误" });
    return;
  }

  setSessionCookie(res, username);
  res.json({ success: true, username });
});

app.post("/api/admin/logout", (req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

app.get("/api/games", asyncHandler(async (req: Request, res: Response) => {
  const search = String(req.query.search || "").trim();

  const [rows] = search
    ? await pool.query<RowDataPacket[]>(
        `SELECT * FROM games
         WHERE name LIKE ? OR genre LIKE ? OR platform LIKE ?
         ORDER BY sort_order DESC, id DESC`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      )
    : await pool.query<RowDataPacket[]>(
        "SELECT * FROM games ORDER BY sort_order DESC, id DESC"
      );

  res.json(rows);
}));

app.get("/api/games/:id", asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM games WHERE id = ? LIMIT 1",
    [id]
  );

  if (rows.length === 0) {
    res.status(404).json({ message: "游戏不存在" });
    return;
  }

  res.json(rows[0]);
}));

app.post("/api/games", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const normalized = normalizePayload(req.body);

  if ("error" in normalized) {
    res.status(400).json(normalized);
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO games (name, cover_image, cloud_link, genre, platform, summary, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      normalized.data.name,
      normalized.data.cover_image,
      normalized.data.cloud_link,
      normalized.data.genre,
      normalized.data.platform,
      normalized.data.summary,
      normalized.data.sort_order
    ]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM games WHERE id = ? LIMIT 1",
    [result.insertId]
  );

  res.status(201).json(rows[0]);
}));

app.put("/api/games/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const normalized = normalizePayload(req.body);

  if ("error" in normalized) {
    res.status(400).json(normalized);
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE games
     SET name = ?, cover_image = ?, cloud_link = ?, genre = ?, platform = ?, summary = ?, sort_order = ?
     WHERE id = ?`,
    [
      normalized.data.name,
      normalized.data.cover_image,
      normalized.data.cloud_link,
      normalized.data.genre,
      normalized.data.platform,
      normalized.data.summary,
      normalized.data.sort_order,
      id
    ]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: "游戏不存在" });
    return;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM games WHERE id = ? LIMIT 1",
    [id]
  );

  res.json(rows[0]);
}));

app.delete("/api/games/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM games WHERE id = ?",
    [id]
  );

  if (result.affectedRows === 0) {
    res.status(404).json({ message: "游戏不存在" });
    return;
  }

  res.json({ success: true });
}));

app.get("/admin", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("*", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "服务器内部错误";
  res.status(500).json({ message });
});

async function bootstrap() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS count FROM games");
  const count = rows[0]?.count ?? 0;
  app.listen(port, () => {
    console.log(`Game showcase server running at http://localhost:${port}`);
    console.log(`Loaded ${count} game records`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
