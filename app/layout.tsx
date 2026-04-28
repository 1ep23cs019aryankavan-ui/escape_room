import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hackovers Escape Room",
  description: "4-level technical escape room for college events"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
