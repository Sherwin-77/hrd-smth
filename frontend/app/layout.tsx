import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthScope } from "@/lib/permissions";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR - Employee Login",
  description: "Sign in to access the HR system.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <AuthScope>{children}</AuthScope>
      </body>
    </html>
  );
}
