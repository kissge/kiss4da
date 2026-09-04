import type { Route } from "./+types/events";
import "./events.css";

export function loader() {
  return [
    {
      organizer: "Alice",
      title: "フリバ",
      date: "2024-06-01",
      books: [
        { id: 1, title: "Book 1", author: "Author 1" },
        { id: 2, title: "Book 2", author: "Author 2" },
      ],
    },
    {
      organizer: "Bob",
      title: "フリバ",
      date: "2024-06-02",
      books: [
        { id: 2, title: "Book 2", author: "Author 2" },
        { id: 3, title: "Book 3", author: "Author 3" },
        { id: 4, title: "Book 4", author: "Author 4" },
      ],
    },
    {
      organizer: "Charlie",
      title: "フリバ",
      date: "2024-06-03",
      books: [{ id: 3, title: "Book 3", author: "Author 3" }],
    },
    {
      organizer: "David",
      title: "フリバ",
      date: "2024-06-04",
      books: [{ id: 4, title: "Book 4", author: "Author 4" }],
    },
  ];
}

export default function Events({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      {loaderData.map((event, index) => (
        <div key={index} className="event-card">
          <div className="event-bio">
            <p>{event.date}</p>
            <p>
              {event.organizer}が{event.title}を開催しました。
            </p>
          </div>
          <div className="event-books">
            {event.books.map((book) => (
              <div key={book.id} className="event-book">
                <p>
                  📙{book.title} / {book.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
