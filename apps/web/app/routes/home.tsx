import { useEffect, useState } from "react";

import { BookDialog } from "../components/BookDialog";
import { QuestionBookList } from "../components/QuestionBookList";
import { apiClient } from "../lib/apiClient";
import { listSavedBooks } from "../lib/book-repository";
import type { Book, BookFormValues, SavedBook } from "../lib/types";

export function meta() {
  return [{ title: "問題集管理" }, { name: "description", content: "問題集を管理します。" }];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [formValues, setFormValues] = useState<BookFormValues | null>(null);
  const [editingBook, setEditingBook] = useState<SavedBook | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  const closeDialog = () => {
    setFormValues(null);
    setEditingBook(null);
  };

  const openDialog = (book?: Book) => {
    setIsSuggestionsOpen(false);
    setEditingBook(null);
    setFormValues({
      id: book?.id ?? "",
      title: book?.title ?? query,
      author: book?.author ?? "",
      publishedAt: book?.publishedAt ?? "",
      description: book?.description ?? "",
      url: book?.url ?? "",
      thumbnailURL: book?.thumbnailURL ?? "",
      readingStatus: "unread",
      readDate: "",
      readSession: "",
      readRange: "",
      comment: "",
    });
  };

  const openEditDialog = (book: SavedBook) => {
    setIsSuggestionsOpen(false);
    setEditingBook(book);
    setFormValues(book);
  };

  const refreshSavedBooks = () => {
    try {
      setSavedBooks(listSavedBooks());
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "ローカルの保存データを読み込めませんでした。",
      );
    }
  };

  useEffect(() => {
    refreshSavedBooks();
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setBooks([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    const timeoutId = window.setTimeout(async () => {
      setSearchError(null);

      try {
        const response = await apiClient.books.$get(
          { query: { q: trimmedQuery } },
          { init: { signal: controller.signal } },
        );

        if (!response.ok) {
          throw new Error(`問題集の検索に失敗しました (${response.status})`);
        }

        const data = await response.json();
        setBooks(data.results);
        setIsSuggestionsOpen(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setBooks([]);
        setSearchError(error instanceof Error ? error.message : "問題集の検索に失敗しました");
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <section className="page">
      <form className="question-book-form" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="question-book-search">
          問題集を検索
        </label>
        <div className="question-book-combobox">
          <input
            id="question-book-search"
            name="questionBook"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="question-book-suggestions"
            aria-expanded={isSuggestionsOpen}
            type="text"
            placeholder="問題集を検索"
            className="question-book-form__input"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsSuggestionsOpen(true);
            }}
            onFocus={() => setIsSuggestionsOpen(Boolean(query.trim()))}
          />
          {isSuggestionsOpen && query.trim() && (
            <div
              id="question-book-suggestions"
              className="question-book-suggestions"
              role="listbox"
            >
              {isSearching && <p className="question-book-suggestions__status">検索中...</p>}
              {searchError && (
                <p className="question-book-suggestions__status question-book-suggestions__status--error">
                  {searchError}
                </p>
              )}
              {!isSearching && !searchError && books.length === 0 && (
                <p className="question-book-suggestions__status">該当する問題集はありません。</p>
              )}
              {!isSearching &&
                !searchError &&
                books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className="question-book-suggestion"
                    role="option"
                    onClick={() => openDialog(book)}
                  >
                    <img
                      src={book.thumbnailURL}
                      alt=""
                      className="question-book-suggestion__thumbnail"
                    />
                    <span className="question-book-suggestion__info">
                      <strong>{book.title}</strong>
                      <span>{book.author}</span>
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button type="button" className="question-book-form__button" onClick={() => openDialog()}>
          追加
        </button>
      </form>

      {storageError && (
        <p className="form-error" role="alert">
          {storageError}
        </p>
      )}
      <QuestionBookList books={savedBooks} onSelect={openEditDialog} />

      {formValues && (
        <BookDialog
          values={formValues}
          onChange={setFormValues}
          onClose={closeDialog}
          onSaved={refreshSavedBooks}
          existingBook={editingBook ?? undefined}
        />
      )}
    </section>
  );
}
