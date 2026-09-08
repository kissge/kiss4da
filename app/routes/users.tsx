import { env } from "cloudflare:workers";
import "./users.css";
import type { Route } from "./+types/users";
import type { UserBook } from "~/types/books";
import BookCard from "~/components/bookCard";

export async function loader({ params }: Route.LoaderArgs) {
  // TODO: Validate id

  const userPromise = await env.Database.prepare(
    "SELECT display_name AS displayName, x_id AS xID, created_at AS createdAt FROM users WHERE x_id = ?",
  )
    .bind(params.id)
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
    JOIN users ON user_books.user_id = users.id
    WHERE users.x_id = ? AND owned = 1
    ORDER BY user_books.id DESC`)
      .bind(params.id)
      .all()
  ).results as unknown as UserBook[];

  return { user, books };
}

export default function Me({ loaderData: { user, books } }: Route.ComponentProps) {
  return (
    <main>
      <div className="profile">{JSON.stringify(user, null, 2)}</div>

      <h2>📚 持っている問題集</h2>

      {books.map((book, index) => (
        <BookCard key={index} book={book} />
      ))}
    </main>
  );
}
