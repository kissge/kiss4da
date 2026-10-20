import type { AppType } from "@kiss4da/api";
import type { hc, InferResponseType } from "hono/client";

type ApiClient = ReturnType<typeof hc<AppType>>;
type BooksResponse = InferResponseType<ApiClient["books"]["$get"], 200>;

export type Book = BooksResponse["results"][number];

export type ReadingStatus = "unread" | "partially-read" | "read";

export type BookFormValues = Book & {
  readingStatus: ReadingStatus;
  readDate: string;
  readSession: string;
  readRange: string;
  comment: string;
};
