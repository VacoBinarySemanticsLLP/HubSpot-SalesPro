import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast"; // <-- 1. Import the toaster
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SmashOps | Repair Dashboard",
  description: "Real-time racket repair queue",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* 2. Add the Toaster right before the closing body tag */}
        <Toaster position="bottom-right" reverseOrder={false} />
      </body>
    </html>
  );
}