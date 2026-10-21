import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("arrange", "routes/arrange.tsx"),
  route("arrange/new", "routes/arrangeNew.tsx"),
] satisfies RouteConfig;
