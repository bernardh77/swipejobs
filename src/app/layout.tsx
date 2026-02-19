import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import { ToastProvider } from "@/components/jobs/ToastProvider";
import QueryProvider from "@/components/providers/QueryProvider";
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
        <QueryProvider>
          <ToastProvider>
            <Navbar />
            <div className="appScroll">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
