import { useEffect } from "react";

import type { BookFormValues, ReadingStatus } from "../lib/types";

type ParticipateBookDialogProps = {
  values: BookFormValues;
  onChange: (values: BookFormValues) => void;
  onClose: () => void;
  onSave: (values: BookFormValues) => void;
};

const readingStatuses: [ReadingStatus, string][] = [
  ["unread", "未読"],
  ["partially-read", "一部既読"],
  ["read", "既読"],
];

export function ParticipateBookDialog({
  values,
  onChange,
  onClose,
  onSave,
}: ParticipateBookDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const update = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) =>
    onChange({ ...values, [key]: value });

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
        aria-labelledby="participate-book-title"
      >
        <button
          type="button"
          className="book-dialog__close"
          aria-label="ダイアログを閉じる"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="participate-book-title">あなたの読了状況を編集</h2>
        <div className="participate-book-dialog__book-info">
          <strong>{values.title}</strong>
          {values.author && <span>{values.author}</span>}
        </div>
        <form
          className="book-dialog__form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(values);
          }}
        >
          <fieldset className="reading-status">
            <legend>読んだ状況</legend>
            <div className="reading-status__options">
              {readingStatuses.map(([value, label]) => (
                <label
                  key={value}
                  className={`reading-status__option reading-status__option--${value} ${values.readingStatus === value ? "reading-status__option--selected" : ""}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    checked={values.readingStatus === value}
                    onChange={() => update("readingStatus", value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {values.readingStatus !== "unread" && (
            <label className="form-field">
              <span>読んだ日付</span>
              <input
                type="date"
                value={values.readDate}
                onChange={(event) => update("readDate", event.target.value)}
              />
            </label>
          )}
          {values.readingStatus === "partially-read" && (
            <label className="form-field">
              <span>読んだ範囲</span>
              <input
                value={values.readRange}
                onChange={(event) => update("readRange", event.target.value)}
              />
            </label>
          )}
          <button type="submit" className="question-book-form__button">
            更新
          </button>
        </form>
      </div>
    </div>
  );
}
