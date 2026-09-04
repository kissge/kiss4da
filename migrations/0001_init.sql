-- Migration number: 0001 	 2026-09-04T04:30:22.862Z

CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT DEFAULT NULL,
  published_on DATE DEFAULT NULL,
  question_count INTEGER DEFAULT NULL,
  url TEXT DEFAULT NULL,
  created_by INTEGER NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  google_id TEXT NOT NULL UNIQUE,
  x_id TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organizer_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  datetime DATETIME DEFAULT NULL,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE event_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  read_status TEXT CHECK (read_status IN ('unread', 'incomplete', 'read')) DEFAULT 'read',
  comment TEXT DEFAULT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE user_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  read_status TEXT CHECK (read_status IN ('unread', 'incomplete', 'read')) DEFAULT 'read',
  comment TEXT DEFAULT NULL,
  owned BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE TABLE circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE circle_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  circle_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (circle_id) REFERENCES circles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
