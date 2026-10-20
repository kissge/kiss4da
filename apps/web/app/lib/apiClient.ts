import { hc } from "hono/client";

import type { AppType } from "@kiss4da/api";

const defaultApiUrl = import.meta.env.DEV ? "http://localhost:8787/" : "/";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? defaultApiUrl;
export const apiClient = hc<AppType>(apiBaseUrl);
