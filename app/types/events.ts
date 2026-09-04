export interface Event {
  id: number;
  title: string;
  datetime: string | null;
  organizer: {
    displayName: string;
    xID: string | null;
  };
  books: {
    id: number;
    title: string;
    author: string | null;
    publishedOn: string | null;
    questionCount: number | null;
    url: string | null;
    readStatus: 'unread' | 'incomplete' | 'read';
    comment: string | null;
  }[];
}
