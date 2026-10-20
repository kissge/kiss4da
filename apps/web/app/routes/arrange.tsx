export function meta() {
  return [
    { title: "読むやつ調整 | kiss4da" },
    { name: "description", content: "読むやつを調整します。" },
  ];
}

const arrangements = [
  { title: "次回の読書会", author: "読書会運営チーム", heldOn: "2026-10-20" },
  { title: "春のクイズ大会", author: "クイズ研究会", heldOn: "2026-10-12" },
  { title: "資格勉強会", author: "学習サークル", heldOn: "2026-10-05" },
];

function formatCreatedDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value));
}

export default function Arrange() {
  return (
    <section className="page">
      <section className="arrange-list" aria-labelledby="arrange-list-title">
        <div className="arrange-list__header">
          <h1 id="arrange-list-title" className="section-title">
            最近参加した調整
          </h1>
          <button type="button" className="arrange-list__add">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth="2" d="M12 5v14M5 12h14" />
            </svg>
            <span>新規作成</span>
          </button>
        </div>

        <div className="arrange-list__items">
          {arrangements.map((arrangement) => (
            <article className="arrange-card" key={arrangement.title}>
              <div className="arrange-card__info">
                <h2>{arrangement.title}</h2>
                <p>{arrangement.author}</p>
                <span>{formatCreatedDate(arrangement.heldOn)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
