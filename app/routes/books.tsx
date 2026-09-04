import type { Route } from "./+types/books";
import "./books.css";

export function loader() {
  return [
    {
      title: "Quiz 01",
      author: "Author 01",
      url: "https://example.com/quiz01",
      publishedOn: "2024-01-01",
      questionCount: 123,
    },
    {
      title: "Quiz 02",
      author: "Author 02",
      url: "https://example.com/quiz02",
      publishedOn: "2024-02-01",
      questionCount: 456,
    },
    {
      title: "Quiz 03",
      author: "Author 03",
      url: "https://example.com/quiz03",
      publishedOn: "2024-03-01",
      questionCount: 789,
    },
    {
      title: "Quiz 04",
      author: "Author 04",
      url: "https://example.com/quiz04",
      publishedOn: "2024-04-01",
      questionCount: 101,
    },
    {
      title: "Quiz 05",
      author: "Author 05",
      url: "https://example.com/quiz05",
      publishedOn: "2024-05-01",
      questionCount: 202,
    },
    {
      title: "Quiz 06",
      author: "Author 06",
      url: "https://example.com/quiz06",
      publishedOn: "2024-06-01",
      questionCount: 303,
    },
  ];
}

export default function Books({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      {loaderData.map((book, index) => (
        <div key={index} className="book-card">
          <div className="book-bio">
            <h2>📙{book.title}</h2>
            <p>
              {book.author} / {book.publishedOn} / {book.questionCount}問収録
            </p>
            <a href={book.url} target="_blank">
              🔗 {book.url.replace(/https?:\/\//, "")}
            </a>
          </div>
          <div className="book-me">foo</div>
        </div>
      ))}
    </main>
  );
}
