import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { apiClient } from "../lib/apiClient";

export function meta() {
  return [
    { title: "調整 | kiss4da" },
    { name: "description", content: "調整の詳細を表示します。" },
  ];
}

export default function ArrangeDetail() {
  const { id } = useParams();
  const [arrangement, setArrangement] = useState<Awaited<
    ReturnType<typeof fetchArrangement>
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("調整IDが指定されていません。");
      return;
    }

    void fetchArrangement(id)
      .then(setArrangement)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "調整を読み込めませんでした。");
      });
  }, [id]);

  if (error) {
    return (
      <section className="page">
        <p className="form-error" role="alert">
          {error}
        </p>
        <Link to="/arrange" className="arrange-list__add">
          調整一覧へ戻る
        </Link>
      </section>
    );
  }

  if (!arrangement) {
    return <section className="page">読み込み中...</section>;
  }

  return (
    <section className="page">
      <Link to="/arrange" className="arrange-detail__back">
        ← 調整一覧
      </Link>
      <header className="arrange-detail__header">
        <p className="page__eyebrow">ARRANGEMENT</p>
        <h1 className="page__title">{arrangement.title}</h1>
        <p className="arrange-detail__organizer">{arrangement.organizerName}</p>
        <p className="arrange-detail__date">{arrangement.heldOn || "開催日未定"}</p>
        {arrangement.description && <p className="page__description">{arrangement.description}</p>}
        <Link to={`/arrange/${arrangement.id}/participate`} className="arrange-detail__participate">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M8 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19.5v-1.25A4.25 4.25 0 0 1 7.75 14h.5a4.25 4.25 0 0 1 4.25 4.25v1.25M16 10V4m-3 3h6"
            />
          </svg>
          参加する
        </Link>
      </header>

      <section className="arrange-detail__books" aria-labelledby="arrange-detail-books-title">
        <h2 id="arrange-detail-books-title" className="section-title">
          読む本リスト
        </h2>
        <div className="question-book-list__items">
          {arrangement.books.map((book) => (
            <a
              className="question-book-card"
              href={book.url || undefined}
              key={book.id}
              target="_blank"
              rel="noreferrer"
            >
              {book.thumbnailURL ? (
                <img src={book.thumbnailURL} alt="" className="question-book-card__thumbnail" />
              ) : (
                <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                  本
                </div>
              )}
              <div className="question-book-card__info">
                <h3>{book.title}</h3>
                {book.author && <p>{book.author}</p>}
              </div>
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}

async function fetchArrangement(id: string) {
  const response = await apiClient.arrangements[":id"].$get({ param: { id } });

  if (!response.ok) {
    throw new Error(
      response.status === 404 ? "調整が見つかりませんでした。" : "調整を読み込めませんでした。",
    );
  }

  return response.json();
}
