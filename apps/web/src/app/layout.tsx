import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Submission Approval Workflow",
  description: "Two-sided application submission and approval workflow"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
