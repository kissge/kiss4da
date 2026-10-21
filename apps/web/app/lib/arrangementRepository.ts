import { readDatabase, writeDatabase } from "./storage";
import type { SavedArrangement } from "./types";

export function listSavedArrangements(): SavedArrangement[] {
  return readDatabase().arrangements;
}

export function saveArrangement(arrangement: SavedArrangement): SavedArrangement {
  const database = readDatabase();

  writeDatabase({
    ...database,
    arrangements: [...database.arrangements, arrangement],
  });

  return arrangement;
}
