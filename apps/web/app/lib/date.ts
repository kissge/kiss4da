function parseDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  return new Date(value.includes(" ") ? value.replace(" ", "T") : value);
}

export function formatDateForDisplay(value: string): string {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function formatDateOrFallback(value: string, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const formatted = formatDateForDisplay(value);
  return formatted === value && Number.isNaN(parseDate(value).getTime()) ? fallback : formatted;
}
