import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Manhattan Kids Activities",
  description:
    "Classes, camps, afterschool programs, museums, and events for NYC families — starting on the Upper West Side.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main>{children}</main>
        <footer className="mt-20 border-t border-border/70 py-10 text-center text-sm text-muted">
          <p>
            © {new Date().getFullYear()} Manhattan Kids Activities. All rights
            reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
