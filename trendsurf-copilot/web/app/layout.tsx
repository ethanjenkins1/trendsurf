import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrendSurf Copilot - AI-Powered Social Media Pipeline",
  description: "AI-powered content pipeline for fintech social media. Built for Agents League @ TechConnect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
