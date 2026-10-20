import type { BookFormValues, SavedBook } from "./types";
import { readDatabase, writeDatabase } from "./storage";

function createLocalId(): string {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`;
}

export function listSavedBooks(): SavedBook[] {
  return readDatabase().books;
}

export function saveBook(values: BookFormValues): SavedBook {
  const now = new Date().toISOString();
  const savedBook: SavedBook = {
    ...values,
    localId: createLocalId(),
    createdAt: now,
    updatedAt: now,
  };
  const database = readDatabase();

  writeDatabase({
    ...database,
    books: [...database.books, savedBook],
  });

  return savedBook;
}
