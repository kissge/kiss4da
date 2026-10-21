const STORAGE_KEY = "kiss4da.database";
const DATABASE_VERSION = 1;

export type LocalDatabase = {
  version: typeof DATABASE_VERSION;
  books: import("./types").SavedBook[];
  arrangements: import("./types").SavedArrangement[];
};

function emptyDatabase(): LocalDatabase {
  return { version: DATABASE_VERSION, books: [], arrangements: [] };
}

function isLocalDatabase(value: unknown): value is LocalDatabase {
  if (!value || typeof value !== "object") {
    return false;
  }

  const database = value as Partial<LocalDatabase>;
  return (
    database.version === DATABASE_VERSION &&
    Array.isArray(database.books) &&
    (database.arrangements === undefined || Array.isArray(database.arrangements))
  );
}

export function readDatabase(): LocalDatabase {
  if (typeof window === "undefined") {
    return emptyDatabase();
  }

  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) {
    return emptyDatabase();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("ローカルの保存データを読み込めませんでした。");
  }

  if (!isLocalDatabase(parsed)) {
    throw new Error("ローカルの保存データの形式が正しくありません。");
  }

  return {
    ...parsed,
    arrangements: parsed.arrangements ?? [],
  };
}

export function writeDatabase(database: LocalDatabase): void {
  if (typeof window === "undefined") {
    throw new Error("ブラウザ上でのみ保存できます。");
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch {
    throw new Error("問題集をローカルに保存できませんでした。");
  }
}
