import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const booksQuerySchema = z.object({
  q: z.string().optional().default(""),
});

const app = new Hono()
  .use("*", cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  }))
  .get(
  "/books",
  zValidator("query", booksQuerySchema),
  (c) => {
    const { q } = c.req.valid("query");

    return c.json({ results: [
      { id: "abcdefgh", title: "Book 1", author: "Author 1", publishedAt: "2022-01-01 12:00:00", description: "This is Book 1", url: "https://example.com/book1", thumbnailURL: "https://placehold.jp/150x225.png" },
      { id: "ijklmnop", title: "Book 2", author: "Author 2", publishedAt: "2022-02-01 12:00:00", description: "This is Book 2", url: "https://example.com/book2", thumbnailURL: "https://placehold.jp/150x225.png" },
      { id: "qrstuvwx", title: "Book 3", author: "Author 3", publishedAt: "2022-03-01 12:00:00", description: "This is Book 3", url: "https://example.com/book3", thumbnailURL: "https://placehold.jp/150x225.png" },
    ] });
  },
);

export { app, booksQuerySchema };
export type AppType = typeof app;
