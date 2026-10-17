import type { Route } from "./+types/arrange";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "日程調整 | 問題集管理" },
    { name: "description", content: "日程を調整します。" },
  ];
}

export default function Arrange() {
  return (
    <section className="page">
      <p className="page__eyebrow">ARRANGE</p>
      <h1 className="page__title">日程調整</h1>
      <p className="page__description">問題集に取り組む日程を調整できます。</p>
    </section>
  );
}
