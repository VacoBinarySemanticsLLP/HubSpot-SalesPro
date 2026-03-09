import "./globals.css";

export const metadata = {
  title: "Sales Investigation Dashboard",
  description:
    "Review HubSpot tickets that require investigation and sync status back to HubSpot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
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
            {/* <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.8rem",
                opacity: 0.8,
              }}
            >
              Backend: FastAPI + HubSpot · Frontend: Next.js
            </p> */}
          </header>
          <main
            style={{ padding: "1.5rem", maxWidth: "1120px", margin: "0 auto" }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

