export interface Book {
  id: number;
  title: string;
  author: string | null;
  published_on: string | null;
  question_count: number | null;
  url: string | null;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}
