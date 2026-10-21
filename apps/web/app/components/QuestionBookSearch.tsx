import { useEffect, useState } from "react";

import { apiClient } from "../lib/apiClient";
import type { Book, SavedBook } from "../lib/types";

type QuestionBookSearchProps = {
  savedBooks: SavedBook[];
  onSelectBook: (book: Book) => void;
  onAddBook: (query: string) => void;
  onBookAdded?: () => void;
};

export function QuestionBookSearch({
  savedBooks,
  onSelectBook,
  onAddBook,
  onBookAdded,
}: QuestionBookSearchProps) {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  const finishAdding = () => {
    setQuery("");
    setBooks([]);
    setIsSuggestionsOpen(false);
    onBookAdded?.();
  };

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
    <div className="question-book-search">
      <div className="question-book-search__heading">
        <h2>問題集を追加</h2>
        <span>タイトルや著者名で検索</span>
      </div>
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
                <p className="question-book-suggestions__status">見つかりません（追加は可能）</p>
              )}
              {!isSearching &&
                !searchError &&
                books.map((book) => {
                  const isSaved = savedBooks.some((savedBook) => savedBook.id === book.id);

                  return (
                    <button
                      key={book.id}
                      type="button"
                      className="question-book-suggestion"
                      role="option"
                      onClick={() => {
                        onSelectBook(book);
                        finishAdding();
                      }}
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
                      {isSaved && <span className="question-book-suggestion__badge">登録済</span>}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        <button
          type="button"
          className="question-book-form__button"
          onClick={() => {
            onAddBook(query);
            finishAdding();
          }}
        >
          追加
        </button>
      </form>
    </div>
  );
}
