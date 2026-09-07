import type { Book } from "~/types/books";
import "./bookCard.css";

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="book-card">
      <div className="book-bio">
        <h2>📙{book.title}</h2>
        <p>
          {book.author ?? "???"} / {book.publishedOn ?? "????-??-??"} / {book.questionCount ?? "??"}
          問収録
        </p>
        {book.url && (
          <a href={book.url} target="_blank">
            🔗 {book.url?.replace(/https?:\/\//, "")}
          </a>
        )}
      </div>
      <div className="book-me"></div>
    </div>
  );
}
