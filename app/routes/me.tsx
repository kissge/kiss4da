import { env } from "cloudflare:workers";
import { data } from "react-router";
import "./me.css";
import type { Route } from "./+types/me";

const USER_ID = 1;

export async function loader() {
  const userPromise = await env.Database.prepare(
    "SELECT display_name AS displayName, x_id AS xID, created_at AS createdAt FROM users WHERE id = ?",
  )
    .bind(USER_ID)
    .first();

  const user = userPromise! as unknown as {
    displayName: string;
    xID: string | null;
    createdAt: string;
  };

  const books = (
    await env.Database.prepare(`
    SELECT
      books.id AS bookID, title, author, published_on AS publishedOn, question_count AS questionCount, url,
      read_status AS readStatus, comment, owned
    FROM books
    JOIN user_books ON books.id = user_books.book_id
    WHERE user_id = ?
    ORDER BY user_books.id DESC`)
      .bind(USER_ID)
      .all()
  ).results as unknown as {
    bookID: number;
    title: string;
    author: string | null;
    publishedOn: string | null;
    questionCount: number | null;
    url: string | null;
    readStatus: "unread" | "incomplete" | "read";
    comment: string | null;
    owned: 0 | 1;
  }[];

  return { user, books };
}

export default function Me({ loaderData: { user, books } }: Route.ComponentProps) {
  return (
    <main>
      <div className="profile">{JSON.stringify(user, null, 2)}</div>

      <div className="toolbar">
        <input placeholder="検索" type="text" className="search" />
        <button>追加</button>
      </div>

      <div className="table">
        {books.map((book) => (
          <div key={book.bookID} className="row">
            <div className="cell">
              {book.title} / {book.author} / {book.publishedOn} / {book.questionCount} / {book.url}
            </div>
            <div className="cell">{book.owned ? "持ってる" : "持ってない"}</div>
            <div className="cell">
              {book.readStatus === "unread"
                ? "未読"
                : book.readStatus === "incomplete"
                  ? "未完"
                  : "読了"}{" "}
              {book.comment}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
