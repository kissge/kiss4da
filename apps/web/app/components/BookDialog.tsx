import { useEffect, useState } from "react";
import { saveBook } from "../lib/book-repository";
import type { BookFormValues } from "../lib/types";

type BookDialogProps = {
  values: BookFormValues;
  onChange: (values: BookFormValues) => void;
  onClose: () => void;
  onSaved: () => void;
};

function formatPublishedDate(value: string) {
  const date = new Date(value.includes(" ") ? value.replace(" ", "T") : value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function BookDialog({ values, onChange, onClose, onSaved }: BookDialogProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const update = <K extends keyof BookFormValues>(
    key: K,
    value: BookFormValues[K],
  ) => onChange({ ...values, [key]: value });

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="book-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-dialog-title"
      >
        <button type="button" className="book-dialog__close" aria-label="ダイアログを閉じる" onClick={onClose}>
          ×
        </button>
        <h2 id="book-dialog-title">問題集を追加</h2>
        <form
          className="book-dialog__form"
          onSubmit={(event) => {
            event.preventDefault();
            try {
              saveBook(values);
              onSaved();
              onClose();
            } catch (error) {
              setSaveError(
                error instanceof Error
                  ? error.message
                  : "問題集の保存に失敗しました。",
              );
            }
          }}
        >
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}
          <div className="book-dialog__thumbnail-field">
            {values.thumbnailURL && (
              <img src={values.thumbnailURL} alt={`${values.title}のサムネイル`} className="book-dialog__thumbnail" />
            )}
          </div>
          <input type="hidden" name="id" value={values.id} />
          <input type="hidden" name="description" value={values.description} />
          <label className="form-field">
            <span>タイトル</span>
            <input name="title" type="text" value={values.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <label className="form-field">
            <span>著者</span>
            <input name="author" type="text" value={values.author} onChange={(event) => update("author", event.target.value)} />
          </label>
          <div className="form-field">
            <span>出版日</span>
            <p className="form-field__value">{formatPublishedDate(values.publishedAt)}</p>
          </div>
          <label className="form-field">
            <span>URL</span>
            <input name="url" type="url" value={values.url} onChange={(event) => update("url", event.target.value)} />
          </label>
          <input type="hidden" name="thumbnailURL" value={values.thumbnailURL} />
          <fieldset className="reading-status">
            <legend>読んだ状況</legend>
            <div className="reading-status__options">
              {([
                ["unread", "未読"],
                ["partially-read", "一部既読"],
                ["read", "既読"],
              ] as const).map(([value, label]) => (
                <label
                  key={value}
                  className={`reading-status__option reading-status__option--${value} ${values.readingStatus === value ? "reading-status__option--selected" : ""}`}
                >
                  <input
                    className="sr-only"
                    name="readingStatus"
                    type="radio"
                    value={value}
                    checked={values.readingStatus === value}
                    onChange={() => update("readingStatus", value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {values.readingStatus !== "unread" && (
            <>
              <label className="form-field">
                <span>読んだ日付</span>
                <input name="readDate" type="date" value={values.readDate} onChange={(event) => update("readDate", event.target.value)} />
              </label>
              <label className="form-field">
                <span>読んだ会</span>
                <input name="readSession" type="text" value={values.readSession} onChange={(event) => update("readSession", event.target.value)} />
              </label>
            </>
          )}
          {values.readingStatus === "partially-read" && (
            <label className="form-field">
              <span>読んだ範囲</span>
              <input name="readRange" type="text" value={values.readRange} onChange={(event) => update("readRange", event.target.value)} />
            </label>
          )}
          <label className="form-field">
            <span>コメント</span>
            <textarea name="comment" rows={4} value={values.comment} onChange={(event) => update("comment", event.target.value)} />
          </label>
          <button type="submit" className="question-book-form__button">自分の本棚に追加</button>
        </form>
      </div>
    </div>
  );
}
