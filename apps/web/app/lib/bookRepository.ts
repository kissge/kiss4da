import { readDatabase, writeDatabase } from "./storage";
import type { BookFormValues, SavedBook } from "./types";

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

export function updateBook(localId: string, values: BookFormValues): SavedBook {
  const database = readDatabase();
  const currentBook = database.books.find((book) => book.localId === localId);

  if (!currentBook) {
    throw new Error("更新対象の問題集が見つかりませんでした。");
  }

  const updatedBook: SavedBook = {
    ...values,
    localId,
    createdAt: currentBook.createdAt,
    updatedAt: new Date().toISOString(),
  };

  writeDatabase({
    ...database,
    books: database.books.map((book) => (book.localId === localId ? updatedBook : book)),
  });

  return updatedBook;
}
