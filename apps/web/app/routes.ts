import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("arrange", "routes/arrange.tsx"),
  route("arrange/new", "routes/arrangeNew.tsx"),
  route("arrange/:id", "routes/arrangeDetail.tsx"),
  route("arrange/:id/read-books", "routes/arrangeReadBooks.tsx"),
  route("arrange/:id/read-books/copy", "routes/arrangeReadBooksCopy.tsx"),
  route("arrange/:id/participate", "routes/arrangeParticipate.tsx"),
] satisfies RouteConfig;
