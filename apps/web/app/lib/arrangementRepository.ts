import { readDatabase, writeDatabase } from "./storage";
import type { SavedArrangement } from "./types";

export function listSavedArrangements(): SavedArrangement[] {
  const database = readDatabase();
  const arrangements = deduplicateArrangements(database.arrangements);

  if (arrangements.length !== database.arrangements.length) {
    writeDatabase({
      ...database,
      arrangements,
    });
  }

  return arrangements;
}

export function saveArrangement(arrangement: SavedArrangement): SavedArrangement {
  const database = readDatabase();
  const arrangements = deduplicateArrangements(
    [...database.arrangements, arrangement],
    arrangement.id,
  );

  writeDatabase({
    ...database,
    arrangements,
  });

  return arrangement;
}

function deduplicateArrangements(
  arrangements: SavedArrangement[],
  preferredId?: string,
): SavedArrangement[] {
  const unique = new Map<string, SavedArrangement>();

  for (const item of arrangements.toReversed()) {
    if (!unique.has(item.id)) {
      unique.set(item.id, item);
    }
  }

  if (preferredId) {
    const preferred = unique.get(preferredId);

    if (preferred) {
      unique.delete(preferredId);
      unique.set(preferredId, preferred);
    }
  }

  return [...unique.values()].toReversed();
}
