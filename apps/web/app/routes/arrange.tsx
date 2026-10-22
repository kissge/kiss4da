import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listSavedArrangements } from "../lib/arrangementRepository";
import { formatDateOrFallback } from "../lib/date";
import type { SavedArrangement } from "../lib/types";

export function meta() {
  return [
    { title: "押し会調整 | kiss4da" },
    { name: "description", content: "押し会で読む問題集の調整を行います。" },
  ];
}

export default function Arrange() {
  const [arrangements, setArrangements] = useState<SavedArrangement[]>([]);

  useEffect(() => {
    setArrangements(listSavedArrangements());
  }, []);

  return (
    <section className="page">
      <section className="arrange-list" aria-labelledby="arrange-list-title">
        <div className="arrange-list__header">
          <h1 id="arrange-list-title" className="section-title">
            最近参加した押し会の調整
          </h1>
          <Link to="/arrange/new" className="arrange-list__add">
            <Plus aria-hidden="true" />
            <span>新規作成</span>
          </Link>
        </div>

        <div className="arrange-list__items">
          {arrangements.map((arrangement) => (
            <Link to={`/arrange/${arrangement.id}`} className="arrange-card" key={arrangement.id}>
              <div className="arrange-card__info">
                <h2>{arrangement.title}</h2>
                <p>{arrangement.organizerName}</p>
                <span>{formatDateOrFallback(arrangement.heldOn, "開催日未定")}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
