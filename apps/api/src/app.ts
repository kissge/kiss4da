import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const booksQuerySchema = z.object({
  q: z.string().optional().default(""),
});

const app = new Hono().get(
  "/books",
  zValidator("query", booksQuerySchema),
  (c) => {
    const { q } = c.req.valid("query");

    return c.json({ hello: q });
  },
);

export { app, booksQuerySchema };
export type AppType = typeof app;
