import type { D1Database } from "@cloudflare/workers-types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getDatabase } from "./db.js";

export type ApiBindings = {
  ALLOWED_ORIGINS?: string;
  BOOKS_API_TOKEN?: string;
  Database?: D1Database;
};

const booksQuerySchema = z.object({
  q: z.string().optional().default(""),
});

const upsertBookSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1),
    author: z.string().trim().default(""),
    publishedAt: z.string().trim().default(""),
    description: z.string().default(""),
    url: z.string().trim().min(1),
    thumbnailURL: z.string().trim().default(""),
  })
  .array()
  .min(1)
  .superRefine((books, context) => {
    const urls = new Set<string>();

    for (const [index, book] of books.entries()) {
      if (urls.has(book.url)) {
        context.addIssue({
          code: "custom",
          message: "同じURLの書籍が複数回送信されています。",
          path: [index, "url"],
        });
      }
      urls.add(book.url);
    }
  });

const arrangementBookSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  author: z.string().trim().default(""),
  url: z.string().trim().default(""),
  position: z.number().int().nonnegative(),
  readingStatus: z.enum(["unread", "partially-read", "read"]).default("unread"),
  readRange: z.string().default(""),
  readDate: z.string().default(""),
});

const createArrangementSchema = z
  .object({
    title: z.string().trim().min(1),
    organizerName: z.string().trim().min(1),
    organizerUserId: z.string().trim().min(1),
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
          message: "読む問題集リストに同じ問題集を重複して登録できません。",
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
    participantUserId: z.string().trim().min(1),
    books: z.array(participateBookSchema).min(1),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();

    for (const [index, book] of value.books.entries()) {
      if (ids.has(book.id)) {
        context.addIssue({
          code: "custom",
          message: "同じ問題集が複数回送信されています。",
          path: ["books", index, "id"],
        });
      }

      ids.add(book.id);
    }
  });

const participantUserIdParamSchema = z.object({
  userId: z.string().trim().min(1),
});

function requireBooksApiToken(c: {
  env: ApiBindings;
  req: { header: (name: string) => string | undefined };
}) {
  const configuredToken = c.env.BOOKS_API_TOKEN;
  if (!configuredToken) {
    throw new Error("BOOKS_API_TOKEN is not configured.");
  }

  const authorization = c.req.header("Authorization");
  if (authorization !== `Bearer ${configuredToken}`) {
    return false;
  }

  return true;
}

const readBooksSchema = z
  .object({
    books: z.array(
      z
        .object({
          bookId: z.string().trim().min(1),
          readingStatus: z.enum(["unread", "partially-read", "read"]),
          readRange: z.string().default(""),
        })
        .superRefine((book, context) => {
          if (book.readingStatus === "partially-read" && !book.readRange.trim()) {
            context.addIssue({
              code: "custom",
              message: "一部既読の場合は読んだ範囲を入力してください。",
              path: ["readRange"],
            });
          }
          if (book.readingStatus !== "partially-read" && book.readRange.trim()) {
            context.addIssue({
              code: "custom",
              message: "一部既読以外では読んだ範囲を空にしてください。",
              path: ["readRange"],
            });
          }
        }),
    ),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();

    for (const [index, book] of value.books.entries()) {
      if (ids.has(book.bookId)) {
        context.addIssue({
          code: "custom",
          message: "同じ問題集が複数回送信されています。",
          path: ["books", index, "bookId"],
        });
      }
      ids.add(book.bookId);
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
  .post("/books", zValidator("json", z.object({ books: upsertBookSchema })), async (c) => {
    if (!requireBooksApiToken(c)) {
      return c.json({ message: "認証に失敗しました。" }, 401);
    }

    const { books } = c.req.valid("json");
    const database = getDatabase(c.env);
    const now = new Date().toISOString();

    const statements = books.map((book) =>
      database
        .prepare(
          `INSERT INTO books
             (id, title, author, published_at, description, url, thumbnail_url, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
           ON CONFLICT(url) DO UPDATE SET
             title = excluded.title,
             author = excluded.author,
             published_at = excluded.published_at,
             description = excluded.description,
             thumbnail_url = excluded.thumbnail_url,
             updated_at = excluded.updated_at`,
        )
        .bind(
          book.id ?? nanoid(),
          book.title,
          book.author,
          book.publishedAt || null,
          book.description,
          book.url,
          book.thumbnailURL || null,
          now,
        ),
    );

    await database.batch(statements);

    return c.json({ count: books.length, upserted: true });
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
           organizer_user_id AS organizerUserId,
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
        organizerUserId: string;
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
           COALESCE(b.published_at, '') AS publishedAt,
           COALESCE(b.description, '') AS description,
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
           '' AS publishedAt,
           '' AS description,
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
        publishedAt: string;
        description: string;
        url: string;
        thumbnailURL: string;
        position: number;
        source: "registered" | "unknown";
      }>();

    const { results: participants } = await database
      .prepare(
        `SELECT participant_id AS participantId, participant_name AS participantName
         FROM arrangement_participants
         WHERE arrangement_id = ?1`,
      )
      .bind(arrangementId)
      .all<{
        participantId: string;
        participantName: string;
      }>();
    const { results: participantBooks } = await database
      .prepare(
        `SELECT
           ap.participant_id AS participantId,
           ap.participant_name AS participantName,
           apb.book_id AS bookId,
           apb.reading_status AS readingStatus,
           apb.read_range AS readRange,
           apb.read_date AS readDate
         FROM arrangement_participant_books apb
         JOIN arrangement_participants ap ON ap.participant_id = apb.participant_id
         WHERE apb.arrangement_id = ?1
         UNION ALL
         SELECT
           ap.participant_id AS participantId,
           ap.participant_name AS participantName,
           apub.arrangement_unknown_book_id AS bookId,
           apub.reading_status AS readingStatus,
           apub.read_range AS readRange,
           apub.read_date AS readDate
         FROM arrangement_participant_unknown_books apub
         JOIN arrangement_participants ap ON ap.participant_id = apub.participant_id
         JOIN arrangement_unknown_books aub ON aub.id = apub.arrangement_unknown_book_id
         WHERE aub.arrangement_id = ?1`,
      )
      .bind(arrangementId)
      .all<{
        participantId: string;
        participantName: string;
        bookId: string;
        readingStatus: "unread" | "partially-read" | "read";
        readRange: string;
        readDate: string | null;
      }>();
    const { results: readBooks } = await database
      .prepare(
        `SELECT
           book_id AS bookId,
           reading_status AS readingStatus,
           read_range AS readRange
         FROM arrangement_read_books
         WHERE arrangement_id = ?1`,
      )
      .bind(arrangementId)
      .all<{
        bookId: string;
        readingStatus: "partially-read" | "read";
        readRange: string;
      }>();
    const readBooksByBookId = new Map(readBooks.map((book) => [book.bookId, book]));
    const participantBooksByBookId = new Map<
      string,
      Map<string, (typeof participantBooks)[number]>
    >();

    for (const participantBook of participantBooks) {
      const current = participantBooksByBookId.get(participantBook.bookId) ?? new Map();
      current.set(participantBook.participantId, participantBook);
      participantBooksByBookId.set(participantBook.bookId, current);
    }
    const booksWithParticipants = books.map((book) => ({
      ...book,
      readBook: readBooksByBookId.get(book.id) ?? null,
      participants: participants.map((participant) => {
        const participantBook = participantBooksByBookId
          .get(book.id)
          ?.get(participant.participantId);
        return {
          participantName: participant.participantName,
          readingStatus: participantBook?.readingStatus ?? "unread",
          readRange: participantBook?.readRange ?? "",
          readDate: participantBook?.readDate ?? null,
        };
      }),
    }));

    return c.json({ ...arrangement, books: booksWithParticipants });
  })
  .post("/arrangements", zValidator("json", createArrangementSchema), async (c) => {
    const input = c.req.valid("json");
    const database = getDatabase(c.env);
    const arrangementId = nanoid();
    const participantId = nanoid();
    const now = new Date().toISOString();
    const existingBookIds = new Set<string>();
    const unknownBookIds = new Map<string, string>();

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
             (id, title, organizer_name, organizer_user_id, held_on, description, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)`,
        )
        .bind(
          arrangementId,
          input.title,
          input.organizerName,
          input.organizerUserId,
          input.heldOn,
          input.description,
          now,
        ),
      database
        .prepare(
          `INSERT INTO arrangement_participants
             (participant_id, arrangement_id, participant_name, user_id, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
        )
        .bind(participantId, arrangementId, input.organizerName, input.organizerUserId, now),
      ...input.books.map((book) => {
        if (existingBookIds.has(book.id)) {
          return database
            .prepare(
              `INSERT INTO arrangement_books (arrangement_id, book_id, position)
               VALUES (?1, ?2, ?3)`,
            )
            .bind(arrangementId, book.id, book.position);
        }

        const unknownBookId = crypto.randomUUID();
        unknownBookIds.set(book.id, unknownBookId);

        return database
          .prepare(
            `INSERT INTO arrangement_unknown_books
               (id, arrangement_id, position, title, author, url)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
          )
          .bind(unknownBookId, arrangementId, book.position, book.title, book.author, book.url);
      }),
      ...input.books
        .filter((book) => book.readingStatus !== "unread")
        .map((book) =>
          database
            .prepare(
              `INSERT INTO arrangement_participant_books
               (participant_id, arrangement_id, book_id, reading_status, read_range, read_date)
             SELECT ?1, ?2, ?3, ?4, ?5, ?6
             WHERE EXISTS (
               SELECT 1 FROM arrangement_books
               WHERE arrangement_id = ?2 AND book_id = ?3
             )`,
            )
            .bind(
              participantId,
              arrangementId,
              book.id,
              book.readingStatus,
              book.readRange,
              book.readDate,
            ),
        ),
      ...input.books
        .filter((book) => unknownBookIds.has(book.id))
        .map((book) =>
          database
            .prepare(
              `INSERT INTO arrangement_participant_unknown_books
                 (participant_id, arrangement_unknown_book_id, reading_status, read_range, read_date)
               VALUES (?1, ?2, ?3, ?4, ?5)`,
            )
            .bind(
              participantId,
              unknownBookIds.get(book.id),
              book.readingStatus,
              book.readRange,
              book.readDate,
            ),
        ),
    ];

    await database.batch(statements);

    return c.json({ id: arrangementId }, 201);
  })
  .get("/arrangements/:id/read-books", async (c) => {
    const database = getDatabase(c.env);
    const arrangementId = c.req.param("id");
    const arrangement = await database
      .prepare("SELECT id FROM arrangements WHERE id = ?1")
      .bind(arrangementId)
      .first<{ id: string }>();

    if (!arrangement) {
      return c.json({ message: "調整が見つかりませんでした。" }, 404);
    }

    const { results } = await database
      .prepare(
        `SELECT
           book_id AS bookId,
           reading_status AS readingStatus,
           read_range AS readRange
         FROM arrangement_read_books
         WHERE arrangement_id = ?1
         ORDER BY book_id`,
      )
      .bind(arrangementId)
      .all<{
        bookId: string;
        readingStatus: "partially-read" | "read";
        readRange: string;
      }>();

    return c.json({ books: results });
  })
  .put("/arrangements/:id/read-books", zValidator("json", readBooksSchema), async (c) => {
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

    const { results: arrangementBooks } = await database
      .prepare(
        `SELECT book_id AS bookId
           FROM arrangement_books
           WHERE arrangement_id = ?1
         UNION ALL
         SELECT id AS bookId
           FROM arrangement_unknown_books
           WHERE arrangement_id = ?1`,
      )
      .bind(arrangementId)
      .all<{ bookId: string }>();
    const allowedBookIds = new Set(arrangementBooks.map((book) => book.bookId));
    const invalidBook = input.books.find((book) => !allowedBookIds.has(book.bookId));

    if (invalidBook) {
      return c.json({ message: "調整に含まれない問題集が送信されました。" }, 400);
    }

    await database.batch([
      database
        .prepare("DELETE FROM arrangement_read_books WHERE arrangement_id = ?1")
        .bind(arrangementId),
      ...input.books
        .filter((book) => book.readingStatus !== "unread")
        .map((book) =>
          database
            .prepare(
              `INSERT INTO arrangement_read_books
                 (arrangement_id, book_id, reading_status, read_range)
               VALUES (?1, ?2, ?3, ?4)`,
            )
            .bind(arrangementId, book.bookId, book.readingStatus, book.readRange.trim()),
        ),
    ]);

    return c.json({ saved: input.books.length });
  })
  .get("/arrangements/:id/participants/:userId", async (c) => {
    const database = getDatabase(c.env);
    const arrangementId = c.req.param("id");
    const { userId } = participantUserIdParamSchema.parse(c.req.param());
    const participant = await database
      .prepare(
        `SELECT participant_id AS participantId, participant_name AS participantName
         FROM arrangement_participants
         WHERE arrangement_id = ?1 AND user_id = ?2`,
      )
      .bind(arrangementId, userId)
      .first<{ participantId: string; participantName: string }>();

    if (!participant) {
      return c.json({ message: "この調整にはまだ参加していません。" }, 404);
    }

    const [{ results: books }, { results: unknownBooks }] = await Promise.all([
      database
        .prepare(
          `SELECT book_id AS id, reading_status AS readingStatus,
                  read_range AS readRange, COALESCE(read_date, '') AS readDate
           FROM arrangement_participant_books
           WHERE participant_id = ?1 AND arrangement_id = ?2`,
        )
        .bind(participant.participantId, arrangementId)
        .all<{
          id: string;
          readingStatus: "unread" | "partially-read" | "read";
          readRange: string;
          readDate: string;
        }>(),
      database
        .prepare(
          `SELECT arrangement_unknown_book_id AS id, reading_status AS readingStatus,
                  read_range AS readRange, COALESCE(read_date, '') AS readDate
           FROM arrangement_participant_unknown_books
           WHERE participant_id = ?1`,
        )
        .bind(participant.participantId)
        .all<{
          id: string;
          readingStatus: "unread" | "partially-read" | "read";
          readRange: string;
          readDate: string;
        }>(),
    ]);

    return c.json({ ...participant, books: [...books, ...unknownBooks] });
  })
  .put(
    "/arrangements/:id/participants/:userId",
    zValidator("json", participateArrangementSchema),
    async (c) => {
      const input = c.req.valid("json");
      const database = getDatabase(c.env);
      const arrangementId = c.req.param("id");
      const { userId } = participantUserIdParamSchema.parse(c.req.param());
      const participant = await database
        .prepare(
          `SELECT participant_id AS participantId
           FROM arrangement_participants
           WHERE arrangement_id = ?1 AND user_id = ?2`,
        )
        .bind(arrangementId, userId)
        .first<{ participantId: string }>();

      if (!participant) {
        return c.json({ message: "この調整にはまだ参加していません。" }, 404);
      }

      const conflictingParticipant = await database
        .prepare(
          `SELECT participant_id
           FROM arrangement_participants
           WHERE arrangement_id = ?1
             AND participant_id != ?2
             AND (participant_name = ?3 OR user_id = ?4)`,
        )
        .bind(arrangementId, participant.participantId, input.participantName, userId)
        .first<{ participantId: string }>();

      if (conflictingParticipant) {
        return c.json({ message: "この名前は別の参加者が使用しています。" }, 409);
      }

      const statements = [
        database
          .prepare(
            `UPDATE arrangement_participants
             SET participant_name = ?, updated_at = ?
             WHERE participant_id = ?`,
          )
          .bind(input.participantName, new Date().toISOString(), participant.participantId),
        database
          .prepare("DELETE FROM arrangement_participant_books WHERE participant_id = ?")
          .bind(participant.participantId),
        database
          .prepare("DELETE FROM arrangement_participant_unknown_books WHERE participant_id = ?")
          .bind(participant.participantId),
        ...input.books.map((book) =>
          database
            .prepare(
              `INSERT INTO arrangement_participant_books
                 (participant_id, arrangement_id, book_id, reading_status, read_range, read_date)
               SELECT ?, ?, ?, ?, ?, ?
               WHERE EXISTS (
                 SELECT 1 FROM arrangement_books
                 WHERE arrangement_id = ? AND book_id = ?
               )`,
            )
            .bind(
              participant.participantId,
              arrangementId,
              book.id,
              book.readingStatus,
              book.readRange,
              book.readDate || null,
              arrangementId,
              book.id,
            ),
        ),
        ...input.books.map((book) =>
          database
            .prepare(
              `INSERT INTO arrangement_participant_unknown_books
                 (participant_id, arrangement_unknown_book_id, reading_status, read_range, read_date)
               SELECT ?, ?, ?, ?, ?
               WHERE EXISTS (
                 SELECT 1 FROM arrangement_unknown_books
                 WHERE id = ? AND arrangement_id = ?
               )`,
            )
            .bind(
              participant.participantId,
              book.id,
              book.readingStatus,
              book.readRange,
              book.readDate || null,
              book.id,
              arrangementId,
            ),
        ),
      ];

      await database.batch(statements);
      return c.json({ participantId: participant.participantId });
    },
  )
  .delete("/arrangements/:id/participants/:userId", async (c) => {
    const database = getDatabase(c.env);
    const arrangementId = c.req.param("id");
    const { userId } = participantUserIdParamSchema.parse(c.req.param());
    const result = await database
      .prepare(
        `DELETE FROM arrangement_participants
         WHERE arrangement_id = ?1 AND user_id = ?2`,
      )
      .bind(arrangementId, userId)
      .run();

    if (!result.meta.changes) {
      return c.json({ message: "この調整には参加していません。" }, 404);
    }

    return c.body(null, 204);
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
           WHERE arrangement_id = ?1
             AND (participant_name = ?2 OR user_id = ?3)`,
        )
        .bind(arrangementId, input.participantName, input.participantUserId)
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
               (participant_id, arrangement_id, participant_name, user_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?5)`,
          )
          .bind(participantId, arrangementId, input.participantName, input.participantUserId, now),
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
