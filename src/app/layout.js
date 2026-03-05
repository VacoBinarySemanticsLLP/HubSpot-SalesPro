import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "../components/Providers";
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
        <Providers>
          {children}
          <Toaster position="bottom-right" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}