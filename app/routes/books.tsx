import { env } from "cloudflare:workers";
import type { Route } from "./+types/books";
import "./books.css";
import type { Book } from "~/types/books";

export async function loader() {
  return (await env.Database.prepare("SELECT * FROM books ORDER BY id DESC").all())
    .results as unknown as Book[];
}

export default function Books({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      {loaderData.map((book, index) => (
        <div key={index} className="book-card">
          <div className="book-bio">
            <h2>📙{book.title}</h2>
            <p>
              {book.author ?? "???"} / {book.published_on ?? "????-??-??"} /{" "}
              {book.question_count ?? "??"}問収録
            </p>
            {book.url && (
              <a href={book.url} target="_blank">
                🔗 {book.url?.replace(/https?:\/\//, "")}
              </a>
            )}
          </div>
          <div className="book-me">foo</div>
        </div>
      ))}
    </main>
  );
}
