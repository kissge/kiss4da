import type { D1Database } from "@cloudflare/workers-types";

import type { ApiBindings } from "./app.js";

export function getDatabase(env: ApiBindings): D1Database {
  if (!env.Database) {
    throw new Error("D1 database binding is not configured.");
  }

  return env.Database;
}
