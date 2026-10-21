import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listSavedArrangements } from "../lib/arrangementRepository";
import type { SavedArrangement } from "../lib/types";

export function meta() {
  return [
    { title: "読むやつ調整 | kiss4da" },
    { name: "description", content: "読むやつを調整します。" },
  ];
}

function formatCreatedDate(value: string) {
  if (!value) {
    return "開催日未定";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "開催日未定";
  }

  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(date);
}

export default function Arrange() {
  const [arrangements, setArrangements] = useState<SavedArrangement[]>([]);

  useEffect(() => {
    setArrangements(listSavedArrangements().toReversed());
  }, []);

  return (
    <section className="page">
      <section className="arrange-list" aria-labelledby="arrange-list-title">
        <div className="arrange-list__header">
          <h1 id="arrange-list-title" className="section-title">
            最近参加した調整
          </h1>
          <Link to="/arrange/new" className="arrange-list__add">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth="2" d="M12 5v14M5 12h14" />
            </svg>
            <span>新規作成</span>
          </Link>
        </div>

        <div className="arrange-list__items">
          {arrangements.map((arrangement) => (
            <Link to={`/arrange/${arrangement.id}`} className="arrange-card" key={arrangement.id}>
              <div className="arrange-card__info">
                <h2>{arrangement.title}</h2>
                <p>{arrangement.organizerName}</p>
                <span>{formatCreatedDate(arrangement.heldOn)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
