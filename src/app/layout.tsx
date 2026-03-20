import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { DemoBanner } from "@/components/demo-banner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jebbix",
  description: "Help students focus on what moves their grade",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Jebbix",
    description: "Help students focus on what moves their grade",
    siteName: "Jebbix",
    url: "https://jebbix.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Nav />
          <DemoBanner />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
