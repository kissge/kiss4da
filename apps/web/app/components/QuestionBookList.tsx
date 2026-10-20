import type { SavedBook } from "../lib/types";

type QuestionBookListProps = {
  books: SavedBook[];
};

export function QuestionBookList({ books }: QuestionBookListProps) {
  return (
    <section className="question-book-list" aria-labelledby="question-book-list-title">
      <h2 id="question-book-list-title" className="section-title">
        自分の本棚
      </h2>
      {books.length === 0 ? (
        <div className="question-book-list__empty" aria-live="polite">
          <p>登録した問題集はありません。</p>
        </div>
      ) : (
        <p aria-live="polite">{books.length}件の問題集を登録しています。</p>
      )}
    </section>
  );
}
