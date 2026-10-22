import {
  BookOpen,
  BookOpenCheck,
  Copy,
  DoorOpen,
  Pencil,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { apiClient } from "../lib/apiClient";
import { formatDateForDisplay, formatDateOrFallback } from "../lib/date";
import { getOrCreateInternalId } from "../lib/internalId";
import { setPendingToast } from "../lib/toast";

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
  const [isParticipant, setIsParticipant] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("調整IDが指定されていません。");
      return;
    }

    const userId = getOrCreateInternalId();
    void Promise.all([fetchArrangement(id), fetchParticipant(id, userId)])
      .then(([result, participant]) => {
        setArrangement(result);
        setIsParticipant(participant);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "調整を読み込めませんでした。");
      });
  }, [id]);

  const leaveArrangement = async () => {
    if (!arrangement || isLeaving) return;
    setIsLeaving(true);
    setParticipantError(null);

    try {
      const response = await apiClient.arrangements[":id"].participants[":userId"].$delete({
        param: { id: arrangement.id, userId: getOrCreateInternalId() },
      });

      if (!response.ok) {
        const body = (await response.json()) as { message?: string };
        throw new Error(body.message ?? "調整から抜けられませんでした。");
      }

      setPendingToast("調整から抜けました。");
      window.location.reload();
    } catch (reason: unknown) {
      setParticipantError(
        reason instanceof Error ? reason.message : "調整から抜けられませんでした。",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const copyArrangementUrl = async () => {
    setCopyError(null);

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("URLをコピーしました。");
    } catch (reason: unknown) {
      setCopyError(reason instanceof Error ? reason.message : "URLをコピーできませんでした。");
    }
  };

  const copyBookText = async (title: string, url: string) => {
    try {
      await navigator.clipboard.writeText(`${title} ${url}`);
      toast.success("問題集情報をコピーしました。");
    } catch (reason: unknown) {
      setCopyError(
        reason instanceof Error ? reason.message : "問題集情報をコピーできませんでした。",
      );
    }
  };

  const copyAllBookText = async () => {
    try {
      const text = arrangement?.books.map((book) => `${book.title} ${book.url}`).join("\n") ?? "";
      await navigator.clipboard.writeText(text);
      toast.success("問題集情報をまとめてコピーしました。");
    } catch (reason: unknown) {
      setCopyError(
        reason instanceof Error ? reason.message : "問題集情報をコピーできませんでした。",
      );
    }
  };

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

  const hasRecordedReadBooks = arrangement.books.some((book) => book.readBook);

  return (
    <section className="page">
      <Link to="/arrange" className="arrange-detail__back">
        ← 調整一覧
      </Link>
      <header className="arrange-detail__header">
        <div className="arrange-detail__summary">
          <div className="arrange-detail__header-actions">
            {arrangement.organizerUserId === getOrCreateInternalId() && (
              <Link to={`/arrange/${arrangement.id}/edit`} className="arrange-detail__copy-url">
                <Pencil aria-hidden="true" />
                調整を編集
              </Link>
            )}
            <button
              type="button"
              className="arrange-detail__copy-url"
              onClick={() => void copyArrangementUrl()}
            >
              <Copy aria-hidden="true" />
              URLをコピー
            </button>
          </div>
          <h1 className="page__title">{arrangement.title}</h1>
          <p className="arrange-detail__organizer">{arrangement.organizerName}</p>
          <p className="arrange-detail__date">
            {formatDateOrFallback(arrangement.heldOn ?? "", "開催日未定")}
          </p>
          {arrangement.description && (
            <p className="page__description">{arrangement.description}</p>
          )}
          {(() => {
            const participantNames = [
              ...new Set(
                arrangement.books.flatMap((book) =>
                  book.participants.map((item) => item.participantName),
                ),
              ),
            ];

            return participantNames.length > 0 ? (
              <p className="arrange-detail__participants">
                {participantNames.join("、")}（{participantNames.length}名）
              </p>
            ) : null;
          })()}
        </div>
        {participantError && (
          <p className="form-error" role="alert">
            {participantError}
          </p>
        )}
        {copyError && (
          <p className="form-error" role="alert">
            URLをコピーできませんでした。
          </p>
        )}
        {isParticipant ? (
          <div className="arrange-detail__participant-actions">
            <Link
              to={`/arrange/${arrangement.id}/participate`}
              className="arrange-detail__participate"
            >
              <Pencil aria-hidden="true" />
              自分の読了状況を編集する
            </Link>
            <button
              type="button"
              className="arrange-detail__leave"
              onClick={() => void leaveArrangement()}
              disabled={isLeaving}
            >
              <DoorOpen aria-hidden="true" />
              {isLeaving ? "退会中..." : "参加をやめる"}
            </button>
          </div>
        ) : (
          <Link
            to={`/arrange/${arrangement.id}/participate`}
            className="arrange-detail__participate"
          >
            <UserRoundPlus aria-hidden="true" />
            参加する
          </Link>
        )}
        <Link to={`/arrange/${arrangement.id}/read-books`} className="arrange-detail__read-books">
          <BookOpenCheck aria-hidden="true" />
          実際に当日読まれた問題集を記録する
        </Link>
        {arrangement.books.some((book) => book.readBook) && (
          <Link
            to={`/arrange/${arrangement.id}/read-books/copy`}
            className="arrange-detail__read-books"
          >
            <BookOpenCheck aria-hidden="true" />
            当日の記録を本棚にコピーする
          </Link>
        )}
      </header>

      <section className="arrange-detail__books" aria-labelledby="arrange-detail-books-title">
        <div className="arrange-detail__books-heading">
          <h2 id="arrange-detail-books-title" className="section-title">
            {hasRecordedReadBooks ? "読んだ問題集リスト" : "読む問題集リスト"}（全
            {arrangement.books.length}冊）
          </h2>
          <button
            type="button"
            className="arrange-detail__copy-url"
            onClick={() => void copyAllBookText()}
          >
            <Copy aria-hidden="true" />
            コピー
          </button>
        </div>
        <div className="question-book-list__items">
          {arrangement.books.map((book) => (
            <div className="arrange-detail__book-item" key={book.id}>
              <article className="question-book-card">
                <a
                  className="question-book-card__link"
                  href={book.url || undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  {book.thumbnailURL ? (
                    <img src={book.thumbnailURL} alt="" className="question-book-card__thumbnail" />
                  ) : (
                    <div className="question-book-card__thumbnail-placeholder" aria-hidden="true">
                      <BookOpen />
                    </div>
                  )}
                  <div className="question-book-card__info">
                    <h3>{book.title}</h3>
                    {(book.author || book.publishedAt) && (
                      <p>
                        {[book.author, formatDateForDisplay(book.publishedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {book.description && (
                      <p className="question-book-card__description">{book.description}</p>
                    )}
                    {book.readBook && (
                      <div className="arrange-detail__read-book">
                        <span>当日読まれた記録</span>
                        <div className="question-book-card__details">
                          <span
                            className={`reading-status-badge reading-status-badge--${book.readBook.readingStatus}`}
                          >
                            {readingStatusLabel(book.readBook.readingStatus)}
                          </span>
                          {book.readBook.readRange && <span>{book.readBook.readRange}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </a>
                <button
                  type="button"
                  className="question-book-card__edit"
                  aria-label={`${book.title}のタイトルとURLをコピー`}
                  onClick={() => void copyBookText(book.title, book.url)}
                >
                  <Copy aria-hidden="true" />
                </button>
              </article>
              {book.participants.length > 0 && (
                <details className="arrange-detail__reading-details">
                  <summary>
                    <Users className="arrange-detail__reading-summary-icon" aria-hidden="true" />
                    <ReadingStatusSummary participants={book.participants} />
                  </summary>
                  <dl>
                    {book.participants.map((participant, index) => (
                      <div key={`${participant.participantName}-${index}`}>
                        <dt>{participant.participantName}</dt>
                        <dd>
                          <span
                            className={`reading-status-badge reading-status-badge--${participant.hasReadingStatus ? participant.readingStatus : "unknown"}`}
                          >
                            {participant.hasReadingStatus
                              ? readingStatusLabel(participant.readingStatus)
                              : "不明"}
                          </span>
                          {participant.readRange && <span>{participant.readRange}</span>}
                          {participant.readDate && (
                            <span>{formatDateForDisplay(participant.readDate)}</span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}

async function fetchParticipant(id: string, userId: string): Promise<boolean> {
  const response = await apiClient.arrangements[":id"].participants[":userId"].$get({
    param: { id, userId },
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error("参加状態を確認できませんでした。");
  }

  return true;
}

function readingStatusLabel(status: "unread" | "partially-read" | "read"): string {
  return status === "unread" ? "未読" : status === "read" ? "既読" : "一部既読";
}

function ReadingStatusSummary({
  participants,
}: {
  participants: {
    hasReadingStatus: boolean;
    readingStatus: "unread" | "partially-read" | "read";
  }[];
}) {
  const counts = {
    unknown: participants.filter((item) => !item.hasReadingStatus).length,
    unread: participants.filter((item) => item.hasReadingStatus && item.readingStatus === "unread")
      .length,
    "partially-read": participants.filter(
      (item) => item.hasReadingStatus && item.readingStatus === "partially-read",
    ).length,
    read: participants.filter((item) => item.hasReadingStatus && item.readingStatus === "read")
      .length,
  };

  const summaries = [
    counts.unknown > 0 && (
      <span className="reading-status-badge reading-status-badge--unknown" key="unknown">
        不明 {counts.unknown}
      </span>
    ),
    counts.unread > 0 && (
      <span className="reading-status-badge reading-status-badge--unread" key="unread">
        未読 {counts.unread}
      </span>
    ),
    counts["partially-read"] > 0 && (
      <span
        className="reading-status-badge reading-status-badge--partially-read"
        key="partially-read"
      >
        一部既読 {counts["partially-read"]}
      </span>
    ),
    counts.read > 0 && (
      <span className="reading-status-badge reading-status-badge--read" key="read">
        既読 {counts.read}
      </span>
    ),
  ].filter(Boolean);

  return <span className="arrange-detail__reading-summary">{summaries}</span>;
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
