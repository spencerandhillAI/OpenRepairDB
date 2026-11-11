import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenRepairDB — Repair knowledge, connected",
  description: "Open, searchable technical repair knowledge for devices, boards and components."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
