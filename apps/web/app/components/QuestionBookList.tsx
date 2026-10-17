export function QuestionBookList() {
  return (
    <section className="question-book-list" aria-labelledby="question-book-list-title">
      <h2 id="question-book-list-title" className="section-title">
        登録した問題集
      </h2>
      <div className="question-book-list__empty" aria-live="polite">
        <p>登録した問題集はありません。</p>
      </div>
    </section>
  );
}
