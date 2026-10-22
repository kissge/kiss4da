import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  useLocation,
  useNavigate,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster, toast } from "sonner";

import "./app.css";
import type { Route } from "./+types/root";
import { BottomTabBar } from "./components/BottomTabBar";
import { getOrCreateInternalId } from "./lib/internalId";
import { consumePendingToast } from "./lib/toast";

export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: `${import.meta.env.BASE_URL}manifest.webmanifest` },
  { rel: "icon", href: "https://kissge.github.io/favicon.png", type: "image/png" },
  { rel: "apple-touch-icon", href: "https://kissge.github.io/favicon.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function meta() {
  return [
    { name: "theme-color", content: "#2563eb" },
    { name: "mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-title", content: "kiss4da" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getOrCreateInternalId();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((reason: unknown) => {
        console.error("Service Workerの登録に失敗しました。", reason);
      });
  }, []);

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    const message = state?.toast ?? consumePendingToast();
    if (!message) return;

    toast.success(message);
    if (state?.toast) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location, navigate]);

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <BottomTabBar />
      <Toaster position="top-center" />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
