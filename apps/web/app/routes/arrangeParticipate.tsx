import { BookOpen, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ParticipateBookDialog } from "../components/ParticipateBookDialog";
import { apiClient } from "../lib/apiClient";
import { saveArrangement } from "../lib/arrangementRepository";
import { listSavedBooks, saveBook, updateBook as updateSavedBook } from "../lib/bookRepository";
import { formatDateForDisplay } from "../lib/date";
import { getOrCreateInternalId } from "../lib/internalId";
import { getSavedUserName, saveUserName } from "../lib/storage";
import type { BookFormValues, ReadingStatus, SavedBook } from "../lib/types";

type Arrangement = Awaited<ReturnType<typeof fetchArrangement>>;

export function meta() {
  return [
    { title: "調整に参加する | kiss4da" },
    { name: "description", content: "調整に参加して、自分の読了状況を入力します。" },
  ];
}

function createBookValues(
  book: Arrangement["books"][number],
  savedBook?: SavedBook,
): BookFormValues {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    publishedAt: book.publishedAt,
    description: book.description,
    url: book.url,
    thumbnailURL: book.thumbnailURL,
    readingStatus: savedBook?.readingStatus ?? "unread",
    readDate: savedBook?.readDate ?? "",
    readSession: "",
    readRange: savedBook?.readRange ?? "",
    comment: "",
  };
}

export default function ArrangeParticipate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [arrangement, setArrangement] = useState<Arrangement | null>(null);
  const [books, setBooks] = useState<BookFormValues[]>([]);
  const [editingBook, setEditingBook] = useState<BookFormValues | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [autoFilledCount, setAutoFilledCount] = useState(0);
  const [savedBookCount, setSavedBookCount] = useState(0);
  const [reflectToBookshelf, setReflectToBookshelf] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("調整IDが指定されていません。");
      return;
    }

    const userId = getOrCreateInternalId();
    void Promise.all([fetchArrangement(id), fetchParticipant(id, userId)])
      .then(([result, participant]) => {
        const savedBooks = listSavedBooks();
        const savedBookIds = new Set(savedBooks.map((book) => book.id));
        setArrangement(result);
        setParticipantId(participant?.participantId ?? null);
        setParticipantName(participant?.participantName ?? getSavedUserName());
        setSavedBookCount(savedBooks.length);
        setBooks(
          result.books.map((book) =>
            createBookValues(
              book,
              savedBooks.find((savedBook) => savedBook.id === book.id),
            ),
          ),
        );
        if (participant) {
          setBooks(
            result.books.map((book) => {
              const values = createBookValues(
                book,
                savedBooks.find((savedBook) => savedBook.id === book.id),
              );
              const participantBook = participant.books.find((item) => item.id === book.id);
              return participantBook ? { ...values, ...participantBook } : values;
            }),
          );
        }
        setAutoFilledCount(result.books.filter((book) => savedBookIds.has(book.id)).length);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "調整を読み込めませんでした。");
      });
  }, [id]);

  const updateBook = (updatedBook: BookFormValues) => {
    setBooks((currentBooks) =>
      currentBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book)),
    );
    setEditingBook(null);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!arrangement || isSubmitting) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const json = {
        participantName: participantName.trim(),
        participantUserId: getOrCreateInternalId(),
        books: books.map((book) => ({
          id: book.id,
          readingStatus: book.readingStatus,
          readRange: book.readRange,
          readDate: book.readDate,
        })),
      };
      const response = participantId
        ? await apiClient.arrangements[":id"].participants[":userId"].$put({
            param: { id: arrangement.id, userId: getOrCreateInternalId() },
            json,
          })
        : await apiClient.arrangements[":id"].participants.$post({
            param: { id: arrangement.id },
            json,
          });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };

        if (response.status === 409) {
          throw new Error(
            body.message ??
              "すでにこの調整に同じ名前の参加者がいます。別の名前を入力するか、既存の参加者を編集してください。",
          );
        }

        throw new Error(body.message ?? `調整への参加に失敗しました (${response.status})`);
      }

      saveArrangement({
        id: arrangement.id,
        title: arrangement.title,
        organizerName: arrangement.organizerName,
        heldOn: arrangement.heldOn ?? "",
      });

      if (reflectToBookshelf) {
        const savedBooks = listSavedBooks();

        for (const book of books) {
          const savedBook = savedBooks.find((saved) => saved.id === book.id);

          if (savedBook) {
            updateSavedBook(savedBook.localId, book);
          } else {
            saveBook(book);
          }
        }
      }

      saveUserName(participantName.trim());
      navigate(`/arrange/${arrangement.id}`, {
        state: { toast: participantId ? "読了状況を更新しました。" : "調整に参加しました。" },
      });
    } catch (reason: unknown) {
      setSubmitError(reason instanceof Error ? reason.message : "調整への参加に失敗しました。");
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

  return (
    <section className="page">
      <Link to={`/arrange/${arrangement.id}`} className="arrange-detail__back">
        ← {arrangement.title}へ戻る
      </Link>
      <header className="page-header arrange-participate__header">
        <h1 className="page__title">
          {arrangement.title}
          {participantId ? "の読了状況を編集する" : "に参加する"}
        </h1>
        <p className="page__description">あなたの読了状況を入力してください。</p>
      </header>

      {savedBookCount === 0 ? (
        <p className="arrange-participate__notice">
          kiss4daを使って本棚にこれまで読んだ問題集を登録すると、押し会で読む問題集の調整が簡単にできます。
        </p>
      ) : (
        autoFilledCount > 0 && (
          <p className="arrange-participate__notice">
            あなたの本棚を見て<strong>{autoFilledCount}冊</strong>
            の読了状況を自動入力しました。
          </p>
        )
      )}

      <form className="arrange-form arrange-participate__form" onSubmit={handleSubmit}>
        <label className="form-field arrange-participate__name">
          <span>あなたの名前</span>
          <input
            name="participantName"
            type="text"
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
          />
        </label>

        <section className="arrange-form__books" aria-labelledby="participate-books-title">
          <div className="arrange-form__section-heading">
            <h2 id="participate-books-title">読む問題集リスト（全{books.length}冊）</h2>
          </div>
          <div className="question-book-list__items">
            {books.map((book) => (
              <article className="question-book-card" key={book.id}>
                <div className="question-book-card__actions">
                  <button
                    type="button"
                    className="question-book-card__edit"
                    aria-label={`${book.title}の読了状況を編集`}
                    onClick={() => setEditingBook(book)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                </div>
                <div className="question-book-card__link">
                  <div className="question-book-card__content">
                    {book.thumbnailURL ? (
                      <img
                        src={book.thumbnailURL}
                        alt=""
                        className="question-book-card__thumbnail"
                      />
                    ) : (
                      <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                        <BookOpen />
                      </div>
                    )}
                    <div className="question-book-card__info">
                      <h3>{book.title}</h3>
                      {book.author && <p>{book.author}</p>}
                      <div className="question-book-card__details">
                        <span
                          className={`reading-status-badge reading-status-badge--${book.readingStatus}`}
                        >
                          {readingStatusLabel(book.readingStatus)}
                        </span>
                        {book.readDate && <span>{formatDateForDisplay(book.readDate)}</span>}
                        {book.readRange && <span>{book.readRange}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <label className="arrange-participate__reflect">
          <input
            type="checkbox"
            checked={reflectToBookshelf}
            onChange={(event) => setReflectToBookshelf(event.target.checked)}
          />
          <span>読了状況を自分の本棚にも反映する</span>
        </label>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className="question-book-form__button"
          disabled={isSubmitting || !participantName.trim()}
        >
          {isSubmitting
            ? participantId
              ? "更新中..."
              : "参加中..."
            : participantId
              ? "更新する"
              : "参加する"}
        </button>
      </form>

      {editingBook && (
        <ParticipateBookDialog
          values={editingBook}
          onChange={setEditingBook}
          onClose={() => setEditingBook(null)}
          onSave={updateBook}
        />
      )}
    </section>
  );
}

function readingStatusLabel(status: ReadingStatus): string {
  return status === "unread" ? "未読" : status === "read" ? "既読" : "一部既読";
}

async function fetchArrangement(id: string) {
  const response = await apiClient.arrangements[":id"].$get({ param: { id } });

  if (!response.ok) {
    throw new Error(
      response.status === 404 ? "調整が見つかりませんでした。" : "調整を読み込めませんでした。",
    );
  }

  return response.json();
}

async function fetchParticipant(id: string, userId: string) {
  const response = await apiClient.arrangements[":id"].participants[":userId"].$get({
    param: { id, userId },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("参加状況を読み込めませんでした。");
  }

  return response.json();
}
