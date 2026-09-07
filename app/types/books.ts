export interface Book {
  id: number;
  title: string;
  author: string | null;
  publishedOn: string | null;
  questionCount: number | null;
  url: string | null;
}

export interface UserBook extends Book {
  readStatus: "unread" | "incomplete" | "read";
  comment: string | null;
  owned: 0 | 1;
}
