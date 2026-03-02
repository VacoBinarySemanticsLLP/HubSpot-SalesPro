import "./globals.css";

export const metadata = {
  title: "Badminton Tracker",
  description: "Internal Equipment Repair Queue",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Next.js will inject your page.js component exactly where 'children' is */}
        {children}
      </body>
    </html>
  );
}