import path from "path";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./db";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");

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

app.post("/api/games", asyncHandler(async (req: Request, res: Response) => {
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

app.put("/api/games/:id", asyncHandler(async (req: Request, res: Response) => {
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

app.delete("/api/games/:id", asyncHandler(async (req: Request, res: Response) => {
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
