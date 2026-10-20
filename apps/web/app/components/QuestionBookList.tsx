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

function formatReadDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function QuestionBookList({ books, onSelect }: QuestionBookListProps) {
  const sortedBooks = [...books].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );

  return (
    <section className="question-book-list" aria-labelledby="question-book-list-title">
      <h2 id="question-book-list-title" className="section-title">
        自分の本棚
      </h2>
      {sortedBooks.length === 0 ? (
        <div className="question-book-list__empty" aria-live="polite">
          <p>登録した問題集はありません。</p>
        </div>
      ) : (
        <div className="question-book-list__items" aria-live="polite">
          {sortedBooks.map((book) => (
            <button
              className="question-book-card"
              key={book.localId}
              type="button"
              onClick={() => onSelect(book)}
            >
              <img
                src={book.thumbnailURL}
                alt=""
                className="question-book-card__thumbnail"
              />
              <div className="question-book-card__info">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <div className="question-book-card__details">
                  <span
                    className={`reading-status-badge reading-status-badge--${book.readingStatus}`}
                  >
                    {readingStatusLabels[book.readingStatus]}
                  </span>
                  {book.readDate && <span>{formatReadDate(book.readDate)}</span>}
                  {book.readRange && <span>{book.readRange}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
