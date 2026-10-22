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

        {arrangements.length === 0 ? (
          <>
            <p className="page__description">
              押し会調整機能を使うと、クイズの押し会で何の問題集を読むか、参加者間で調整することが簡単にできます。
            </p>
            <p className="page__description">
              主催者から共有された調整ページにアクセスすれば、自分の本棚に既読と記録されている問題集について自動的に既読と回答することができます。
            </p>
            <p className="page__description">
              また押し会実施後には、実際に当日読まれた問題集を記録することで、各参加者は各自の本棚に何をどこまで読んだかの記録をコピーすることができます。
            </p>
          </>
        ) : (
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
        )}
      </section>
    </section>
  );
}
