import { ArrowLeft, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { apiClient } from "../lib/apiClient";
import { listSavedBooks } from "../lib/bookRepository";

type Arrangement = Awaited<ReturnType<typeof fetchArrangement>>;
type ReadBook = {
  bookId: string;
  readingStatus: "unread" | "partially-read" | "read";
  readRange: string;
};

const readingStatuses: ReadBook["readingStatus"][] = ["unread", "partially-read", "read"];
const readingStatusLabels: Record<ReadBook["readingStatus"], string> = {
  unread: "未読",
  "partially-read": "一部既読",
  read: "既読",
};

export function meta() {
  return [
    { title: "当日読んだ問題集を記録 | kiss4da" },
    { name: "description", content: "調整当日に読んだ問題集を記録します。" },
  ];
}

export default function ArrangeReadBooks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [savedBooks, setSavedBooks] = useState(() => listSavedBooks());
  const [books, setBooks] = useState<ReadBook[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("調整IDが指定されていません。");
      return;
    }

    void Promise.all([fetchArrangement(id), fetchReadBooks(id)])
      .then(([result, readBooks]) => {
        const savedById = new Map(readBooks.map((book) => [book.bookId, book]));
        setArrangement(result);
        setBooks(
          result.books.map((book) => {
            const saved = savedById.get(book.id);
            return (
              saved ?? {
                bookId: book.id,
                readingStatus: "unread",
                readRange: "",
              }
            );
          }),
        );
        setSavedBooks(listSavedBooks());
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "読書記録を読み込めませんでした。");
      });
  }, [id]);

  const updateBook = (bookId: string, changes: Partial<ReadBook>) => {
    setBooks((currentBooks) =>
      currentBooks.map((book) => (book.bookId === bookId ? { ...book, ...changes } : book)),
    );
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!arrangement || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiClient.arrangements[":id"]["read-books"].$put({
        param: { id: arrangement.id },
        json: { books },
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "読書記録を保存できませんでした。");
      }

      navigate(`/arrange/${arrangement.id}`, {
        state: { toast: "当日の読書記録を保存しました。" },
      });
    } catch (reason: unknown) {
      setSubmitError(reason instanceof Error ? reason.message : "読書記録を保存できませんでした。");
    } finally {
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

  if (!arrangement) {
    return <section className="page">読み込み中...</section>;
  }

  const bookById = new Map(arrangement.books.map((book) => [book.id, book]));
  const savedBookById = new Map(savedBooks.map((book) => [book.id, book]));

  return (
    <section className="page">
      <Link to={`/arrange/${arrangement.id}`} className="arrange-detail__back">
        <ArrowLeft aria-hidden="true" />
        {arrangement.title}へ戻る
      </Link>
      <header className="page-header arrange-read-books__header">
        <h1 className="page__title">実際に当日読んだ問題集を記録する</h1>
        <p className="page__description">
          {arrangement.title}で読んだ問題集と読了状況を入力してください。
        </p>
      </header>

      <form className="arrange-read-books__form" onSubmit={handleSubmit}>
        <div className="arrange-read-books__list">
          {books.map((book) => {
            const details = bookById.get(book.bookId);
            if (!details) return null;
            const thumbnailURL =
              details.thumbnailURL || savedBookById.get(book.bookId)?.thumbnailURL;

            return (
              <article className="arrange-read-book" key={book.bookId}>
                <div className="arrange-read-book__heading">
                  {thumbnailURL ? (
                    <img src={thumbnailURL} alt="" className="arrange-read-book__thumbnail" />
                  ) : (
                    <BookOpen aria-hidden="true" />
                  )}
                  <h2>{details.title}</h2>
                </div>
                {details.author && <p className="arrange-read-book__author">{details.author}</p>}
                <fieldset className="reading-status">
                  <legend>読了状況</legend>
                  <div className="reading-status__options">
                    {readingStatuses.map((readingStatus) => (
                      <label
                        key={readingStatus}
                        className={`reading-status__option reading-status__option--${readingStatus} ${book.readingStatus === readingStatus ? "reading-status__option--selected" : ""}`}
                      >
                        <input
                          className="sr-only"
                          type="radio"
                          name={`reading-status-${book.bookId}`}
                          checked={book.readingStatus === readingStatus}
                          onChange={() =>
                            updateBook(book.bookId, {
                              readingStatus,
                              readRange: readingStatus === "partially-read" ? book.readRange : "",
                            })
                          }
                        />
                        <span>{readingStatusLabels[readingStatus]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                {book.readingStatus === "partially-read" && (
                  <label className="form-field">
                    <span>読んだ範囲</span>
                    <input
                      type="text"
                      value={book.readRange}
                      onChange={(event) =>
                        updateBook(book.bookId, { readRange: event.target.value })
                      }
                      required
                    />
                  </label>
                )}
              </article>
            );
          })}
        </div>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
        <button type="submit" className="question-book-form__button" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存する"}
        </button>
      </form>
    </section>
  );
}

async function fetchArrangement(id: string) {
  const response = await apiClient.arrangements[":id"].$get({ param: { id } });
  if (!response.ok) {
    throw new Error("調整を読み込めませんでした。");
  }
  return response.json();
}

async function fetchReadBooks(id: string): Promise<ReadBook[]> {
  const response = await apiClient.arrangements[":id"]["read-books"].$get({
    param: { id },
  });
  if (!response.ok) {
    throw new Error("当日の読書記録を読み込めませんでした。");
  }
  return (await response.json()).books;
}
