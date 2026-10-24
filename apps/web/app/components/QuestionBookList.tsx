import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { formatDateForDisplay } from "../lib/date";
import type { SavedBook } from "../lib/types";

type QuestionBookListProps = {
  books: SavedBook[];
  onSelect: (book: SavedBook) => void;
  onDelete: (book: SavedBook) => void;
};

const readingStatusLabels = {
  unread: "未読",
  "partially-read": "一部既読",
  read: "既読",
} as const;

type SortOrder = "updatedAt" | "publishedAt";

export function QuestionBookList({ books, onSelect, onDelete }: QuestionBookListProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("updatedAt");
  const sortedBooks = useMemo(
    () =>
      [...books].sort((a, b) => {
        if (sortOrder === "publishedAt") {
          const publishedAtA = Date.parse(a.publishedAt);
          const publishedAtB = Date.parse(b.publishedAt);
          if (Number.isNaN(publishedAtA) || Number.isNaN(publishedAtB)) {
            if (Number.isNaN(publishedAtA) && !Number.isNaN(publishedAtB)) return 1;
            if (!Number.isNaN(publishedAtA) && Number.isNaN(publishedAtB)) return -1;
          } else {
            const publishedAtDifference = publishedAtB - publishedAtA;
            if (publishedAtDifference !== 0) return publishedAtDifference;
          }
        }

        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }),
    [books, sortOrder],
  );

  return (
    <section className="question-book-list" aria-labelledby="question-book-list-title">
      <div className="question-book-list__header">
        <h2 id="question-book-list-title" className="section-title">
          自分の本棚（全{books.length}件）
        </h2>
        <div className="question-book-list__sort" aria-label="本棚の並び順">
          <button
            type="button"
            className={sortOrder === "updatedAt" ? "question-book-list__sort--active" : ""}
            aria-pressed={sortOrder === "updatedAt"}
            onClick={() => setSortOrder("updatedAt")}
          >
            追加・更新順
          </button>
          <button
            type="button"
            className={sortOrder === "publishedAt" ? "question-book-list__sort--active" : ""}
            aria-pressed={sortOrder === "publishedAt"}
            onClick={() => setSortOrder("publishedAt")}
          >
            出版日順
          </button>
        </div>
      </div>
      {sortedBooks.length === 0 ? (
        <div className="question-book-list__empty" aria-live="polite">
          <p>登録した問題集はありません。</p>
        </div>
      ) : (
        <div className="question-book-list__items" aria-live="polite">
          {sortedBooks.map((book) => (
            <article className="question-book-card" key={book.localId}>
              <div className="question-book-card__actions">
                <button
                  type="button"
                  className="question-book-card__edit"
                  aria-label={`${book.title}を編集`}
                  onClick={() => onSelect(book)}
                >
                  <Pencil aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="question-book-card__delete"
                  aria-label={`${book.title}を削除`}
                  onClick={() => onDelete(book)}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
              <a
                className="question-book-card__link"
                href={book.url || undefined}
                target="_blank"
                rel="noreferrer"
              >
                <div className="question-book-card__content">
                  {book.thumbnailURL ? (
                    <img src={book.thumbnailURL} alt="" className="question-book-card__thumbnail" />
                  ) : (
                    <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                      <BookOpen />
                    </div>
                  )}
                  <div className="question-book-card__info">
                    <h3>
                      {book.owned === true && <span className="ownership-status-badge">所有</span>}
                      {book.title}
                    </h3>
                    <p>
                      {book.author} · {formatDateForDisplay(book.publishedAt)}
                    </p>
                    {book.description && (
                      <p className="question-book-card__description">{book.description}</p>
                    )}
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
                </div>
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
