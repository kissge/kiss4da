import { env } from "cloudflare:workers";
import type { Event } from "~/types/events";
import type { Route } from "./+types/events";
import "./events.css";

export async function loader() {
  const raw = (
    await env.Database.prepare(`
    SELECT
      events.id AS event_id, events.title AS event_title, events.datetime,
      users.display_name, users.x_id,
      event_books.read_status, event_books.comment,
      books.id AS book_id, books.title AS book_title, books.author, books.published_on,
      books.question_count, books.url
    FROM events
    JOIN users ON events.organizer_id = users.id
    JOIN event_books ON events.id = event_books.event_id
    JOIN books ON event_books.book_id = books.id
    ORDER BY datetime DESC`).all()
  ).results as unknown as {
    event_id: number;
    event_title: string;
    datetime: string | null;
    display_name: string;
    x_id: string | null;
    read_status: "unread" | "incomplete" | "read";
    comment: string | null;
    book_id: number;
    book_title: string;
    author: string | null;
    published_on: string | null;
    question_count: number | null;
    url: string | null;
  }[];

  return raw.reduce<Event[]>((acc, row) => {
    const event = acc.find((e) => e.id === row.event_id);
    if (event) {
      event.books.push({
        id: row.book_id,
        title: row.book_title,
        author: row.author,
        publishedOn: row.published_on,
        questionCount: row.question_count,
        url: row.url,
        readStatus: row.read_status,
        comment: row.comment,
      });
    } else {
      acc.push({
        id: row.event_id,
        title: row.event_title,
        datetime: row.datetime,
        organizer: {
          displayName: row.display_name,
          xID: row.x_id,
        },
        books: [
          {
            id: row.book_id,
            title: row.book_title,
            author: row.author,
            publishedOn: row.published_on,
            questionCount: row.question_count,
            url: row.url,
            readStatus: row.read_status,
            comment: row.comment,
          },
        ],
      });
    }
    return acc;
  }, []);
}

export default function Events({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      {loaderData.map((event, index) => (
        <div key={index} className="event-card">
          <div className="event-bio">
            <p>{event.datetime}</p>
            <p>
              {event.organizer.displayName} @{event.organizer.xID} が{event.title}を開催しました。
            </p>
          </div>
          <div className="event-books">
            {event.books.map((book) => (
              <div key={book.id} className="event-book">
                <p>
                  📙{book.title} / {book.author} [{book.readStatus} ({book.comment})]
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
