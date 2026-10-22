import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { ArrangeBookDialog } from "../components/ArrangeBookDialog";
import { QuestionBookSearch } from "../components/QuestionBookSearch";
import { apiClient } from "../lib/apiClient";
import { saveArrangement } from "../lib/arrangementRepository";
import { listSavedBooks } from "../lib/bookRepository";
import { getOrCreateInternalId } from "../lib/internalId";
import { getSavedUserName, saveUserName } from "../lib/storage";
import type { Book, BookFormValues, SavedBook } from "../lib/types";

export function meta() {
  return [
    { title: "調整を新規作成 | kiss4da" },
    { name: "description", content: "読む本と日程の調整を新規作成します。" },
  ];
}

function createBookFromQuery(query: string): Book | null {
  const title = query.trim();

  if (!title) {
    return null;
  }

  return {
    id: `custom-${crypto.randomUUID()}`,
    title,
    author: "",
    publishedAt: "",
    description: "",
    url: "",
    thumbnailURL: "",
  };
}

function createArrangeBook(book: Book, savedBook?: SavedBook): BookFormValues {
  return {
    ...book,
    readingStatus: savedBook?.readingStatus ?? "unread",
    readDate: savedBook?.readDate ?? "",
    readSession: savedBook?.readSession ?? "",
    readRange: savedBook?.readRange ?? "",
    comment: "",
  };
}

export default function ArrangeNew() {
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [books, setBooks] = useState<BookFormValues[]>([]);
  const [editingBook, setEditingBook] = useState<BookFormValues | null>(null);
  const [arrangementName, setArrangementName] = useState("");
  const [organizerName, setOrganizerName] = useState(() => getSavedUserName());
  const [heldOn, setHeldOn] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const excludedBookIds = useMemo(() => books.map((book) => book.id), [books]);

  useEffect(() => {
    setSavedBooks(listSavedBooks());
  }, []);

  const addBook = (book: Book) => {
    const savedBook = savedBooks.find((saved) => saved.id === book.id);
    setBooks((currentBooks) =>
      currentBooks.some((currentBook) => currentBook.id === book.id)
        ? currentBooks
        : [...currentBooks, createArrangeBook(book, savedBook)],
    );
  };

  const addBookFromQuery = (query: string) => {
    const book = createBookFromQuery(query);

    if (book) {
      addBook(book);
    }
  };

  const updateBook = (updatedBook: BookFormValues) => {
    setBooks((currentBooks) =>
      currentBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book)),
    );
    setEditingBook(null);
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.arrangements.$post({
        json: {
          title: arrangementName.trim(),
          organizerName: organizerName.trim(),
          organizerUserId: getOrCreateInternalId(),
          heldOn,
          description,
          books: books.map((book, position) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            url: book.url,
            position,
            readingStatus: book.readingStatus,
            readRange: book.readRange,
            readDate: book.readDate,
          })),
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `調整の作成に失敗しました (${response.status})`);
      }

      const result = await response.json();
      saveArrangement({
        id: result.id,
        title: arrangementName.trim(),
        organizerName: organizerName.trim(),
        heldOn,
      });
      saveUserName(organizerName.trim());
      navigate(`/arrange/${result.id}`, { state: { toast: "調整を作成しました。" } });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "調整の作成に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page__title">調整を新規作成</h1>
      </header>

      <form className="arrange-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>会の名前</span>
          <input
            name="title"
            type="text"
            value={arrangementName}
            onChange={(event) => setArrangementName(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>主催者の名前</span>
          <input
            name="author"
            type="text"
            value={organizerName}
            onChange={(event) => setOrganizerName(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>開催日</span>
          <input
            name="heldOn"
            type="date"
            value={heldOn}
            onChange={(event) => setHeldOn(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>説明</span>
          <textarea
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <section className="arrange-form__books" aria-labelledby="arrange-books-title">
          <div className="arrange-form__section-heading">
            <h2 id="arrange-books-title">読む本リスト</h2>
            <span>{books.length}冊</span>
          </div>
          <QuestionBookSearch
            savedBooks={savedBooks}
            onSelectBook={addBook}
            onAddBook={addBookFromQuery}
            excludedBookIds={excludedBookIds}
          />
          <div className="question-book-list__items">
            {books.map((book) => (
              <article className="question-book-card" key={book.id}>
                <div className="question-book-card__link">
                  {book.thumbnailURL ? (
                    <img src={book.thumbnailURL} alt="" className="question-book-card__thumbnail" />
                  ) : (
                    <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                      本
                    </div>
                  )}
                  <div className="question-book-card__info">
                    <h3>{book.title}</h3>
                    {book.author && <p>{book.author}</p>}
                    <div className="question-book-card__details">
                      <span
                        className={`reading-status-badge reading-status-badge--${book.readingStatus}`}
                      >
                        {book.readingStatus === "unread"
                          ? "未読"
                          : book.readingStatus === "read"
                            ? "既読"
                            : "一部既読"}
                      </span>
                      {book.readRange && <span>{book.readRange}</span>}
                    </div>
                  </div>
                </div>
                <div className="question-book-card__actions">
                  <button
                    type="button"
                    className="question-book-card__edit"
                    aria-label={`${book.title}を編集`}
                    onClick={() => setEditingBook(book)}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="question-book-card__delete"
                    aria-label={`${book.title}を読む本リストから削除`}
                    onClick={() =>
                      setBooks((currentBooks) => currentBooks.filter((item) => item.id !== book.id))
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <button
          type="submit"
          className="question-book-form__button"
          disabled={
            isSubmitting || !arrangementName.trim() || !organizerName.trim() || books.length === 0
          }
        >
          {isSubmitting ? "作成中..." : "作成"}
        </button>
      </form>
      {editingBook && (
        <ArrangeBookDialog
          values={editingBook}
          onChange={setEditingBook}
          onClose={() => setEditingBook(null)}
          onSave={updateBook}
        />
      )}
    </section>
  );
}
