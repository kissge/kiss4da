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

export interface CircleBook extends Book {
  members: Record<
    "unread" | "incomplete" | "read",
    {
      name: string;
      comment: string | null;
      owned: 0 | 1;
    }[]
  >;
}
