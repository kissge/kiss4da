import { BookOpen, Pencil } from "lucide-react";

import { formatDateForDisplay } from "../lib/date";
import type { SavedBook } from "../lib/types";

type QuestionBookListProps = {
  books: SavedBook[];
  onSelect: (book: SavedBook) => void;
};

const readingStatusLabels = {
  unread: "未読",
  "partially-read": "一部既読",
  read: "既読",
} as const;

export function QuestionBookList({ books, onSelect }: QuestionBookListProps) {
  const sortedBooks = [...books].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  return (
    <section className="question-book-list" aria-labelledby="question-book-list-title">
      <h2 id="question-book-list-title" className="section-title">
        自分の本棚（全{sortedBooks.length}件）
      </h2>
      {sortedBooks.length === 0 ? (
        <div className="question-book-list__empty" aria-live="polite">
          <p>登録した問題集はありません。</p>
        </div>
      ) : (
        <div className="question-book-list__items" aria-live="polite">
          {sortedBooks.map((book) => (
            <article className="question-book-card" key={book.localId}>
              <a
                className="question-book-card__link"
                href={book.url || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {book.thumbnailURL ? (
                  <img src={book.thumbnailURL} alt="" className="question-book-card__thumbnail" />
                ) : (
                  <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                    <BookOpen />
                  </div>
                )}
                <div className="question-book-card__info">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <div className="question-book-card__details">
                    <span
                      className={`reading-status-badge reading-status-badge--${book.readingStatus}`}
                    >
                      {readingStatusLabels[book.readingStatus]}
                    </span>
                    {book.readDate && <span>{formatDateForDisplay(book.readDate)}</span>}
                    {book.readRange && <span>{book.readRange}</span>}
                  </div>
                </div>
              </a>
              <button
                type="button"
                className="question-book-card__edit"
                aria-label={`${book.title}を編集`}
                onClick={() => onSelect(book)}
              >
                <Pencil aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
