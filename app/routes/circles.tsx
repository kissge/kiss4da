import type { Route } from "./+types/circles";
import "./circles.css";

export function loader() {
  const one = [
    {
      title: "問題集A",
      readStatus: "incomplete",
      readOn: "2026-01-01",
      owners: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
    },
    {
      title: "問題集B",
      readStatus: "complete",
      readOn: "2026-02-01",
      owners: [{ id: 3, name: "Charlie" }],
    },
    {
      title: "問題集C",
      readStatus: "unread",
      readOn: "2026-03-01",
      owners: [
        { id: 4, name: "David" },
        { id: 5, name: "Eve" },
        { id: 6, name: "Frank" },
      ],
    },
  ];

  return [...one, ...one, ...one, ...one, ...one, ...one, ...one, ...one, ...one, ...one];
}

export default function Circles({ loaderData }: Route.ComponentProps) {
  return (
    <main>
      <div className="circle-header">
        <h1>
          <select>
            <option>Circle X</option>
            <option>Circle Y</option>
            <option>新規</option>
          </select>
        </h1>

        <div className="circle-actions">
          <button>問題集を追加</button>
        </div>
      </div>

      <div className="book-table">
        {loaderData.map((book) => (
          <div key={book.title} className="book-row">
            <div className="book-cell">{book.title}</div>
            <div className="book-cell">
              {book.readStatus}
              {book.readOn}
            </div>
            <div className="book-cell">{book.owners.map((owner) => owner.name).join(", ")}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
