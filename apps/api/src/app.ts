import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getDatabase } from "./db.js";

export type ApiBindings = {
  ALLOWED_ORIGINS?: string;
  Database?: D1Database;
};

const booksQuerySchema = z.object({
  q: z.string().optional().default(""),
});

const arrangementBookSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  author: z.string().trim().default(""),
  url: z.string().trim().default(""),
  position: z.number().int().nonnegative(),
});

const createArrangementSchema = z
  .object({
    title: z.string().trim().min(1),
    organizerName: z.string().trim().min(1),
    heldOn: z.string().trim().optional().default(""),
    description: z.string().default(""),
    books: z.array(arrangementBookSchema).min(1),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();

    for (const [index, book] of value.books.entries()) {
      if (ids.has(book.id)) {
        context.addIssue({
          code: "custom",
          message: "読む本リストに同じ本を重複して登録できません。",
          path: ["books", index, "id"],
        });
      }

      ids.add(book.id);
    }
  });

const participateBookSchema = z.object({
  id: z.string().trim().min(1),
  readingStatus: z.enum(["unread", "partially-read", "read"]),
  readRange: z.string().default(""),
  readDate: z.string().default(""),
});

const participateArrangementSchema = z
  .object({
    participantName: z.string().trim().min(1),
    books: z.array(participateBookSchema).min(1),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();

    for (const [index, book] of value.books.entries()) {
      if (ids.has(book.id)) {
        context.addIssue({
          code: "custom",
          message: "同じ本が複数回送信されています。",
          path: ["books", index, "id"],
        });
      }

      ids.add(book.id);
    }
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
  })
  .get("/arrangements/:id", async (c) => {
    const database = getDatabase(c.env);
    const arrangementId = c.req.param("id");
    const arrangement = await database
      .prepare(
        `SELECT
           id,
           title,
           organizer_name AS organizerName,
           held_on AS heldOn,
           description,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM arrangements
         WHERE id = ?1`,
      )
      .bind(arrangementId)
      .first<{
        id: string;
        title: string;
        organizerName: string;
        heldOn: string | null;
        description: string;
        createdAt: string;
        updatedAt: string;
      }>();

    if (!arrangement) {
      return c.json({ message: "調整が見つかりませんでした。" }, 404);
    }

    const { results: books } = await database
      .prepare(
        `SELECT
           b.id,
           b.title,
           b.author,
           b.url,
           b.thumbnail_url AS thumbnailURL,
           ab.position,
           'registered' AS source
         FROM arrangement_books ab
         JOIN books b ON b.id = ab.book_id
         WHERE ab.arrangement_id = ?1
         UNION ALL
         SELECT
           aub.id,
           aub.title,
           aub.author,
           aub.url,
           '' AS thumbnailURL,
           aub.position,
           'unknown' AS source
         FROM arrangement_unknown_books aub
         WHERE aub.arrangement_id = ?1
         ORDER BY position ASC`,
      )
      .bind(arrangementId)
      .all<{
        id: string;
        title: string;
        author: string;
        url: string;
        thumbnailURL: string;
        position: number;
        source: "registered" | "unknown";
      }>();

    return c.json({ ...arrangement, books });
  })
  .post("/arrangements", zValidator("json", createArrangementSchema), async (c) => {
    const input = c.req.valid("json");
    const database = getDatabase(c.env);
    const arrangementId = nanoid();
    const now = new Date().toISOString();
    const existingBookIds = new Set<string>();

    for (const book of input.books) {
      const existingBook = await database
        .prepare("SELECT id FROM books WHERE id = ?1")
        .bind(book.id)
        .first<{ id: string }>();

      if (existingBook) {
        existingBookIds.add(book.id);
      }
    }

    const statements = [
      database
        .prepare(
          `INSERT INTO arrangements
             (id, title, organizer_name, held_on, description, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`,
        )
        .bind(
          arrangementId,
          input.title,
          input.organizerName,
          input.heldOn,
          input.description,
          now,
        ),
      ...input.books.map((book) => {
        if (existingBookIds.has(book.id)) {
          return database
            .prepare(
              `INSERT INTO arrangement_books (arrangement_id, book_id, position)
               VALUES (?1, ?2, ?3)`,
            )
            .bind(arrangementId, book.id, book.position);
        }

        return database
          .prepare(
            `INSERT INTO arrangement_unknown_books
               (id, arrangement_id, position, title, author, url)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
          )
          .bind(
            crypto.randomUUID(),
            arrangementId,
            book.position,
            book.title,
            book.author,
            book.url,
          );
      }),
    ];

    await database.batch(statements);

    return c.json({ id: arrangementId }, 201);
  })
  .post(
    "/arrangements/:id/participants",
    zValidator("json", participateArrangementSchema),
    async (c) => {
      const input = c.req.valid("json");
      const database = getDatabase(c.env);
      const arrangementId = c.req.param("id");
      const arrangement = await database
        .prepare("SELECT id FROM arrangements WHERE id = ?1")
        .bind(arrangementId)
        .first<{ id: string }>();

      if (!arrangement) {
        return c.json({ message: "調整が見つかりませんでした。" }, 404);
      }

      const existingParticipant = await database
        .prepare(
          `SELECT participant_id
           FROM arrangement_participants
           WHERE arrangement_id = ?1 AND participant_name = ?2`,
        )
        .bind(arrangementId, input.participantName)
        .first<{ participantId: string }>();

      if (existingParticipant) {
        return c.json(
          {
            message:
              "すでにこの調整に同じ名前の参加者がいます。別の名前を入力するか、既存の参加者を編集してください。",
          },
          409,
        );
      }

      const [{ results: registeredBooks }, { results: unknownBooks }] = await Promise.all([
        database
          .prepare(
            `SELECT book_id AS id
             FROM arrangement_books
             WHERE arrangement_id = ?1`,
          )
          .bind(arrangementId)
          .all<{ id: string }>(),
        database
          .prepare(
            `SELECT id
             FROM arrangement_unknown_books
             WHERE arrangement_id = ?1`,
          )
          .bind(arrangementId)
          .all<{ id: string }>(),
      ]);
      const registeredBookIds = new Set(registeredBooks.map((book) => book.id));
      const unknownBookIds = new Set(unknownBooks.map((book) => book.id));
      const invalidBook = input.books.find(
        (book) => !registeredBookIds.has(book.id) && !unknownBookIds.has(book.id),
      );

      if (invalidBook) {
        return c.json({ message: "調整に含まれない問題集が送信されました。" }, 400);
      }

      const participantId = nanoid();
      const now = new Date().toISOString();
      const statements = [
        database
          .prepare(
            `INSERT INTO arrangement_participants
               (participant_id, arrangement_id, participant_name, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?4)`,
          )
          .bind(participantId, arrangementId, input.participantName, now),
        ...input.books.map((book) => {
          const readDate = book.readDate || null;

          if (registeredBookIds.has(book.id)) {
            return database
              .prepare(
                `INSERT INTO arrangement_participant_books
                   (participant_id, arrangement_id, book_id, reading_status, read_range, read_date)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
              )
              .bind(
                participantId,
                arrangementId,
                book.id,
                book.readingStatus,
                book.readRange,
                readDate,
              );
          }

          return database
            .prepare(
              `INSERT INTO arrangement_participant_unknown_books
                 (participant_id, arrangement_unknown_book_id, reading_status, read_range, read_date)
               VALUES (?1, ?2, ?3, ?4, ?5)`,
            )
            .bind(participantId, book.id, book.readingStatus, book.readRange, readDate);
        }),
      ];

      await database.batch(statements);

      return c.json({ participantId }, 201);
    },
  );

export { app, booksQuerySchema };
export type AppType = typeof app;
