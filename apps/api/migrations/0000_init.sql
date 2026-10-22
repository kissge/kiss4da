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
  organizer_user_id TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS arrangement_participants (
  participant_id TEXT PRIMARY KEY NOT NULL,
  arrangement_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (arrangement_id, participant_name),
  UNIQUE (arrangement_id, user_id),
  FOREIGN KEY (arrangement_id) REFERENCES arrangements (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arrangement_participant_books (
  participant_id TEXT NOT NULL,
  arrangement_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  reading_status TEXT NOT NULL DEFAULT 'unread'
    CHECK (reading_status IN ('unread', 'partially-read', 'read')),
  read_range TEXT NOT NULL DEFAULT '',
  read_date TEXT,
  PRIMARY KEY (participant_id, arrangement_id, book_id),
  FOREIGN KEY (participant_id) REFERENCES arrangement_participants (participant_id) ON DELETE CASCADE,
  FOREIGN KEY (arrangement_id, book_id) REFERENCES arrangement_books (arrangement_id, book_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS arrangement_participant_unknown_books (
  participant_id TEXT NOT NULL,
  arrangement_unknown_book_id TEXT NOT NULL,
  reading_status TEXT NOT NULL DEFAULT 'unread'
    CHECK (reading_status IN ('unread', 'partially-read', 'read')),
  read_range TEXT NOT NULL DEFAULT '',
  read_date TEXT,
  PRIMARY KEY (participant_id, arrangement_unknown_book_id),
  FOREIGN KEY (participant_id) REFERENCES arrangement_participants (participant_id) ON DELETE CASCADE,
  FOREIGN KEY (arrangement_unknown_book_id) REFERENCES arrangement_unknown_books (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS arrangement_participants_arrangement_idx
  ON arrangement_participants (arrangement_id);

CREATE INDEX IF NOT EXISTS arrangement_participant_books_participant_idx
  ON arrangement_participant_books (participant_id, arrangement_id);

CREATE INDEX IF NOT EXISTS arrangement_participant_unknown_books_participant_idx
  ON arrangement_participant_unknown_books (participant_id);

CREATE TABLE IF NOT EXISTS arrangement_read_books (
  arrangement_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  reading_status TEXT NOT NULL
    CHECK (reading_status IN ('partially-read', 'read')),
  read_range TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (arrangement_id, book_id),
  FOREIGN KEY (arrangement_id) REFERENCES arrangements (id) ON DELETE CASCADE,
  CHECK (
    (reading_status = 'partially-read' AND read_range <> '')
    OR (reading_status = 'read' AND read_range = '')
  )
);

CREATE INDEX IF NOT EXISTS arrangement_read_books_arrangement_idx
  ON arrangement_read_books (arrangement_id);
