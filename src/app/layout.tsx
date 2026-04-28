import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIDEN Brand Audit",
  description: "AI-powered competitive brand intelligence. Part of the AIDEN platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SkipToContent />
        <OfflineBanner />
        <main id="main-content">
        {children}
        </main>
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
