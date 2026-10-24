import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { apiClient } from "../lib/apiClient";
import { listSavedBooks, saveBook, updateBook } from "../lib/bookRepository";
import type { BookFormValues, ReadingStatus, SavedBook } from "../lib/types";

type Arrangement = Awaited<ReturnType<typeof fetchArrangement>>;
type ArrangementBook = Arrangement["books"][number];
type ReadBook = ArrangementBook & {
  readBook: NonNullable<ArrangementBook["readBook"]>;
};

export function meta() {
  return [
    { title: "当日の記録を本棚にコピー | kiss4da" },
    { name: "description", content: "調整当日に実際に読んだ記録を本棚にコピーします。" },
  ];
}

export default function ArrangeReadBooksCopy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("調整IDが指定されていません。");
      return;
    }

    void fetchArrangement(id)
      .then((result) => {
        const readBooks = result.books.filter((book): book is ReadBook => book.readBook !== null);
        setArrangement(result);
        setSavedBooks(listSavedBooks());
        setSelectedBookIds(new Set(readBooks.map((book) => book.id)));
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "調整を読み込めませんでした。");
      });
  }, [id]);

  const toggleBook = (bookId: string) => {
    setSelectedBookIds((current) => {
      const next = new Set(current);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!arrangement || isSubmitting) return;

    setIsSubmitting(true);
    try {
      for (const book of arrangement.books) {
        if (!book.readBook || !selectedBookIds.has(book.id)) continue;

        const savedBook = savedBooks.find((saved) => saved.id === book.id);
        const values = createBookValues(book, savedBook, book.readBook, arrangement);
        if (savedBook) updateBook(savedBook.localId, values);
        else saveBook(values);
      }

      navigate(`/arrange/${arrangement.id}`, { state: { toast: "本棚にコピーしました。" } });
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "本棚へのコピーに失敗しました。");
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <section className="page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/arrange" className="arrange-list__add">
          調整一覧へ戻る
        </Link>
      </section>
    );
  }

  if (!arrangement) return <section className="page">読み込み中...</section>;

  const readBooks = arrangement.books.filter((book): book is ReadBook => book.readBook !== null);

  return (
    <section className="page">
      <Link to={`/arrange/${arrangement.id}`} className="arrange-detail__back">
        <ArrowLeft aria-hidden="true" />
        {arrangement.title}へ戻る
      </Link>
      <header className="page-header arrange-read-books__header">
        <h1 className="page__title">当日の記録を本棚にコピーする</h1>
        <p className="page__description">本棚に反映する問題集を選択してください。</p>
      </header>

      <form className="arrange-read-books__form" onSubmit={handleSubmit}>
        <div className="arrange-read-books__list">
          {readBooks.map((book) => {
            const savedBook = savedBooks.find((saved) => saved.id === book.id);
            const isSelected = selectedBookIds.has(book.id);

            return (
              <article
                className={`arrange-read-book arrange-read-book--copy ${isSelected ? "arrange-read-book--selected" : ""}`}
                key={book.id}
              >
                <div className="arrange-read-book__copy-check">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    aria-label={`${book.title}を本棚にコピー`}
                    onChange={() => toggleBook(book.id)}
                  />
                </div>
                <div className="arrange-read-book__copy-content">
                  <div className="arrange-read-book__heading">
                    <h2>{book.title}</h2>
                  </div>
                  {book.author && <p className="arrange-read-book__author">{book.author}</p>}
                  {isSelected && (
                    <div className="arrange-read-book__comparison">
                      <BookShelfStatus book={savedBook} />
                      <span className="arrange-read-book__arrow" aria-hidden="true">
                        →
                      </span>
                      <ReadingStatusView
                        status={book.readBook.readingStatus}
                        readRange={book.readBook.readRange}
                      />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <button type="submit" className="question-book-form__button" disabled={isSubmitting}>
          {isSubmitting ? "コピー中..." : "コピーする"}
        </button>
      </form>
    </section>
  );
}

function createBookValues(
  book: ArrangementBook,
  savedBook: SavedBook | undefined,
  readBook: NonNullable<ReadBook["readBook"]>,
  arrangement: Arrangement,
): BookFormValues {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publishedAt: book.publishedAt,
    description: book.description,
    url: book.url,
    thumbnailURL: book.thumbnailURL,
    owned: savedBook?.owned,
    readingStatus: readBook.readingStatus,
    readDate: arrangement.heldOn ?? "",
    readSession: arrangement.title,
    readRange: readBook.readRange,
    comment: savedBook?.comment ?? "",
  };
}

function BookShelfStatus({ book }: { book: SavedBook | undefined }) {
  if (!book) return <span className="arrange-read-book__not-saved">本棚に未登録</span>;
  return <ReadingStatusView status={book.readingStatus} readRange={book.readRange} />;
}

function ReadingStatusView({ status, readRange }: { status: ReadingStatus; readRange: string }) {
  return (
    <div className="arrange-read-book__status">
      <span className={`reading-status-badge reading-status-badge--${status}`}>
        {status === "unread" ? "未読" : status === "read" ? "既読" : "一部既読"}
      </span>
      {readRange && <span>{readRange}</span>}
    </div>
  );
}

async function fetchArrangement(id: string) {
  const response = await apiClient.arrangements[":id"].$get({ param: { id } });
  if (!response.ok) throw new Error("調整を読み込めませんでした。");
  return response.json();
}
