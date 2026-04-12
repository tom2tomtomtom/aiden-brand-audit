import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BRAND DNA // ANALYZER",
  description: "AI-powered competitive brand intelligence. Powered by AIDEN.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0f0f0f",
              border: "2px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              borderRadius: "0",
            },
          }}
        />
      </body>
    </html>
  );
}
