const PENDING_TOAST_KEY = "kiss4da.pendingToast";

export function setPendingToast(message: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PENDING_TOAST_KEY, message);
  }
}

export function consumePendingToast(): string | null {
  if (typeof window === "undefined") return null;

  const message = window.sessionStorage.getItem(PENDING_TOAST_KEY);
  if (message) window.sessionStorage.removeItem(PENDING_TOAST_KEY);
  return message;
}
