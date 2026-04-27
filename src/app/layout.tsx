import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "osu! Session Tracker",
  description: "Track osu! play sessions and revisit your progress over time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
