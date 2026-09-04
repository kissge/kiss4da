import type { Route } from "./+types/books";

export function loader() {
  return [
    { title: "Quiz 01", author: "Author 01", url: "https://example.com/quiz01" },
    { title: "Quiz 02", author: "Author 02", url: "https://example.com/quiz02" },
    { title: "Quiz 03", author: "Author 03", url: "https://example.com/quiz03" },
    { title: "Quiz 04", author: "Author 04", url: "https://example.com/quiz04" },
    { title: "Quiz 05", author: "Author 05", url: "https://example.com/quiz05" },
    { title: "Quiz 06", author: "Author 06", url: "https://example.com/quiz06" },
    { title: "Quiz 07", author: "Author 07", url: "https://example.com/quiz07" },
    { title: "Quiz 08", author: "Author 08", url: "https://example.com/quiz08" },
    { title: "Quiz 09", author: "Author 09", url: "https://example.com/quiz09" },
    { title: "Quiz 10", author: "Author 10", url: "https://example.com/quiz10" },
  ];
}

export default function Books({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData[0].title}</div>;
}
