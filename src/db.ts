import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export type GameRecord = {
  id: number;
  name: string;
  cover_image: string;
  cloud_link: string;
  genre: string;
  platform: string;
  summary: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
