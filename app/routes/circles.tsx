import { env } from "cloudflare:workers";
import type { Route } from "./+types/circles";
import "./circles.css";
import type { CircleBook } from "~/types/books";
import BookCard from "~/components/bookCard";

const USER_ID = 1;

export async function loader({ params }: Route.LoaderArgs) {
  const userCircles = (
    await env.Database.prepare(`
    SELECT
      circles.id AS circleId, circles.name AS circleName
    FROM circles
    JOIN circle_members ON circles.id = circle_members.circle_id
    WHERE circle_members.user_id = ?`)
      .bind(USER_ID)
      .all()
  ).results as unknown as {
    circleId: number;
    circleName: string;
  }[];

  const circleBooks = (
    (
      await env.Database.prepare(`
        SELECT
          b.id AS bookId,
          b.title AS bookTitle,
          b.author AS author,
          b.published_on AS publishedOn,
          b.question_count AS questionCount,
          b.url AS url,
          u.display_name AS userName,
          COALESCE(ub.read_status, 'unread') AS readStatus,
          COALESCE(ub.owned, 0) AS owned,
          ub.comment AS comment
        FROM circle_members cm
        JOIN users u ON cm.user_id = u.id
        -- サークルメンバーが「1人でも登録している本」のID一覧を抽出
        CROSS JOIN (
          SELECT DISTINCT ub_inner.book_id
          FROM user_books ub_inner
          JOIN circle_members cm_inner ON ub_inner.user_id = cm_inner.user_id
          WHERE cm_inner.circle_id = 1
        ) circle_books
        JOIN books b ON circle_books.book_id = b.id
        -- ユーザーごとの実際の登録状況をLEFT JOIN
        LEFT JOIN user_books ub ON u.id = ub.user_id AND b.id = ub.book_id
        WHERE cm.circle_id = ?
        ORDER BY b.id, u.id`)
        .bind(params.id)
        .all()
    ).results as unknown as {
      bookId: number;
      bookTitle: string;
      author: string;
      publishedOn: string;
      questionCount: number;
      url: string;
      readStatus: "unread" | "incomplete" | "read";
      comment: string;
      owned: 0 | 1;
      userName: string;
    }[]
  ).reduce<CircleBook[]>((acc, row) => {
    const book = acc.find((b) => b.id === row.bookId);
    if (book) {
      book.members[row.readStatus].push({
        name: row.userName,
        comment: row.comment,
        owned: row.owned,
      });
    } else {
      acc.push({
        id: row.bookId,
        title: row.bookTitle,
        author: row.author,
        publishedOn: row.publishedOn,
        questionCount: row.questionCount,
        url: row.url,
        members: {
          unread: [],
          incomplete: [],
          read: [],
        },
      });
    }
    return acc;
  }, []);

  return { userCircles, circleBooks };
}

export default function Circles({
  loaderData: { userCircles, circleBooks },
}: Route.ComponentProps) {
  return (
    <main>
      <div className="circle-header">
        <h1>
          <select>
            {userCircles.map((circle) => (
              <option key={circle.circleId} value={circle.circleId}>
                {circle.circleName}
              </option>
            ))}
            <option>新規</option>
          </select>
        </h1>

        <div className="circle-actions">
          <button>問題集を追加</button>
        </div>
      </div>

      {circleBooks.map((book, index) => (
        <BookCard key={index} book={book}>
          <div className="book-members">
            既読
            {book.members.read.map((member, memberIndex) => (
              <div key={memberIndex} className="book-member">
                <span className="book-member-name">{member.name}</span>
                {member.comment && "💬"}
                {member.owned && "🈶"}
              </div>
            ))}
            一部既読
            {book.members.incomplete.map((member, memberIndex) => (
              <div key={memberIndex} className="book-member">
                <span className="book-member-name">{member.name}</span>
                {member.comment && "💬"}
                {member.owned && "🈶"}
              </div>
            ))}
          </div>
        </BookCard>
      ))}
    </main>
  );
}
