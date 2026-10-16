import type { Metadata } from "next";
// @ts-ignore Next.js processes global CSS imports at build time.
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import localFont from "next/font/local";

const inter = localFont({
  src: "./public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remote Jobs | Find Your Next Career Opportunity",
  description:
    "Explore the latest remote job opportunities from leading companies. Discover work-from-home and fully remote positions that match your skills, and take the next step in your career.",
  keywords: [
    "remote jobs",
    "remote job board",
    "work from home jobs",
    "fully remote jobs",
    "remote career opportunities",
    "online jobs",
    "remote work",
    "work from anywhere",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} `}
      >
        <SessionProvider>
          <Navbar />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}