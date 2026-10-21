CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  author TEXT,
  published_at TEXT,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS books_title_idx ON books (title);

CREATE TABLE IF NOT EXISTS arrangements (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  held_on TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS arrangement_books (
  arrangement_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  PRIMARY KEY (arrangement_id, book_id),
  FOREIGN KEY (arrangement_id) REFERENCES arrangements (id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arrangement_unknown_books (
  id TEXT PRIMARY KEY NOT NULL,
  arrangement_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (arrangement_id) REFERENCES arrangements (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS arrangement_books_arrangement_position_idx
  ON arrangement_books (arrangement_id, position);

CREATE INDEX IF NOT EXISTS arrangement_unknown_books_arrangement_idx
  ON arrangement_unknown_books (arrangement_id);
