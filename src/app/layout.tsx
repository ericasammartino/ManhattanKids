import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Manhattan Kids Activities",
  description: "Classes, camps, museums, events and more. All in one place for NYC families.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: "#faf9f7" }}>
        <Nav />
        <main>{children}</main>
        <footer className="mt-20 py-10 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Manhattan Kids Activities. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
