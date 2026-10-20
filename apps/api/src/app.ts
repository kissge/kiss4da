import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";

import { getDatabase } from "./db.js";

export type ApiBindings = {
  ALLOWED_ORIGINS?: string;
  Database?: D1Database;
};

const booksQuerySchema = z.object({
  q: z.string().optional().default(""),
});

const app = new Hono<{ Bindings: ApiBindings }>()
  .use(
    "*",
    cors({
      origin: (origin, c) => {
        const allowedOrigins = (
          c.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000"
        ).split(",");

        return allowedOrigins.includes(origin) ? origin : null;
      },
    }),
  )
  .get("/books", zValidator("query", booksQuerySchema), async (c) => {
    const { q } = c.req.valid("query");
    const database = getDatabase(c.env);
    const pattern = `%${q.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    const { results } = await database
      .prepare(
        `SELECT
           id,
           COALESCE(title, '') AS title,
           COALESCE(author, '') AS author,
           COALESCE(published_at, '') AS publishedAt,
           COALESCE(description, '') AS description,
           COALESCE(url, '') AS url,
           COALESCE(thumbnail_url, '') AS thumbnailURL
         FROM books
         WHERE title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\'
         ORDER BY updated_at DESC`,
      )
      .bind(pattern, pattern)
      .all<{
        id: string;
        title: string;
        author: string;
        publishedAt: string;
        description: string;
        url: string;
        thumbnailURL: string;
      }>();

    return c.json({ results });
  });

export { app, booksQuerySchema };
export type AppType = typeof app;
