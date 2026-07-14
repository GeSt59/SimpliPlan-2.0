import type { Metadata } from "next";
import { Rubik, Raleway } from "next/font/google";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SimpliPlan",
  description: "Helfer-Planung für Vereine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${rubik.variable} ${raleway.variable}`}>
      <body className="antialiased font-body">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
