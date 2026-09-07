import { env } from "cloudflare:workers";
import type { Route } from "./+types/books";
import type { Book } from "~/types/books";
import BookCard from "~/components/bookCard";

export async function loader() {
  return (
    await env.Database.prepare(`
    SELECT
      id, title, author, published_on AS publishedOn, question_count AS questionCount, url
    FROM books ORDER BY id DESC`).all()
  ).results as unknown as Book[];
}

export default function Books({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      {loaderData.map((book, index) => (
        <BookCard key={index} book={book} />
      ))}
    </main>
  );
}
