import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "react-hot-toast";
import HtmlLang from "@/components/common/HtmlLang";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MusicApp",
  description: "Your music streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            <HtmlLang /> {/* تنظیم lang و dir */}
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}