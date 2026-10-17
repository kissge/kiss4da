import type { Route } from "./+types/home";
import { QuestionBookList } from "../components/QuestionBookList";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "問題集管理" },
    { name: "description", content: "問題集を管理します。" },
  ];
}

export default function Home() {
  return (
    <section className="page">
      <form className="question-book-form">
        <label className="sr-only" htmlFor="question-book-search">
          問題集を検索
        </label>
        <input
          id="question-book-search"
          name="questionBook"
          list="question-book-options"
          type="text"
          placeholder="問題集を検索"
          className="question-book-form__input"
          autoComplete="off"
        />
        <datalist id="question-book-options" />
        <button type="button" className="question-book-form__button">
          追加
        </button>
      </form>

      <details className="reading-details">
        <summary>詳細情報を入力</summary>
        <div className="reading-details__fields">
          <label className="form-field">
            <span>読んだ日付</span>
            <input name="readDate" type="date" />
          </label>
          <label className="form-field">
            <span>読んだ会</span>
            <input name="readSession" type="text" />
          </label>
          <label className="form-field">
            <span>読んだ範囲</span>
            <input name="readRange" type="text" />
          </label>
          <label className="form-field">
            <span>コメント</span>
            <textarea name="comment" rows={4} />
          </label>
        </div>
      </details>

      <QuestionBookList />
    </section>
  );
}
