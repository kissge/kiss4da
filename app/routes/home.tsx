import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "問題集管理" },
    { name: "description", content: "問題集を管理します。" },
  ];
}

export default function Home() {
  return (
    <section className="page">
      <p className="page__eyebrow">QUESTION COLLECTIONS</p>
      <h1 className="page__title">問題集管理</h1>
      <p className="page__description">問題集を管理するためのホーム画面です。</p>
    </section>
  );
}
