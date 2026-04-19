import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-family",
});

export const metadata: Metadata = {
  title: "Rampurhat TOTO",
  description: "Hyperlocal TOTO booking platform for travel, transport, and delivery inside Rampurhat.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}