import "./globals.css";

export const metadata = {
  title: "Sales Investigation Dashboard",
  description:
    "Review HubSpot tickets that require investigation and sync status back to HubSpot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" }}>
        <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9" }}>
          <header
            style={{
              backgroundColor: "#0f172a",
              color: "white",
              padding: "0.75rem 1.5rem",
              boxShadow: "0 2px 4px rgba(15,23,42,0.5)",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "1.25rem" }}>
              Sales Investigation Console
            </h1>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", opacity: 0.8 }}>
              Backend: FastAPI + HubSpot · Frontend: Next.js
            </p>
          </header>
          <main style={{ padding: "1.5rem", maxWidth: "1120px", margin: "0 auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sales Investigation Dashboard",
  description:
    "Review HubSpot investigations, update statuses, and sync back to HubSpot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Sales Investigation Console
                </h1>
                <p className="text-sm text-slate-500">
                  Powered by HubSpot tickets & your FastAPI backend.
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
