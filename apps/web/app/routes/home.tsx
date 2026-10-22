import { useEffect, useState } from "react";

import { BookDialog } from "../components/BookDialog";
import { QuestionBookList } from "../components/QuestionBookList";
import { QuestionBookSearch } from "../components/QuestionBookSearch";
import { listSavedBooks } from "../lib/bookRepository";
import type { Book, BookFormValues, SavedBook } from "../lib/types";

export function meta() {
  return [{ title: "本棚 | kiss4da" }, { name: "description", content: "問題集を管理します。" }];
}

export default function Home() {
  const [formValues, setFormValues] = useState<BookFormValues | null>(null);
  const [editingBook, setEditingBook] = useState<SavedBook | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);

  const closeDialog = () => {
    setFormValues(null);
    setEditingBook(null);
  };

  const openDialog = (book?: Book, query = "") => {
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
    setEditingBook(book);
    setFormValues(book);
  };

  const openBookDialog = (book: Book) => {
    const savedBook = savedBooks.find((saved) => saved.id === book.id);

    if (savedBook) {
      openEditDialog(savedBook);
      return;
    }

    openDialog(book);
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

  return (
    <section className="page">
      <QuestionBookSearch
        savedBooks={savedBooks}
        onSelectBook={openBookDialog}
        onAddBook={(query) => openDialog(undefined, query)}
      />

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
