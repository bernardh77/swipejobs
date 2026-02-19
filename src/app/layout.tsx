import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SwipeJobs | Matches",
  description: "Review your worker profile and matched job opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div className="appScroll">{children}</div>
      </body>
    </html>
  );
}
