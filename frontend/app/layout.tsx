import type { Metadata } from "next";
// @ts-ignore Next.js processes global CSS imports at build time.
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import localFont from "next/font/local";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remote Job Board - Find Your Dream Remote Job",
  description: "Discover remote job opportunities from top companies. Updated daily with the latest positions.",
  keywords: ["remote jobs", "work from home", "remote work", "job board"],
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