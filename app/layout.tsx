import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import Navbar from "@/components/navbar";
import MobileNav from "@/components/MobileNav";
import InstallPrompt from "@/components/InstallPrompt";
import CopilotBubble from "@/components/CopilotBubble";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "AUTOPILOT - Smart Car Maintenance",
  description: "Premium automotive services with AI-powered maintenance assistant. Track your vehicle health, find local shops, and earn CarCoins.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "AUTOPILOT",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#06b6d4",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <InstallPrompt />
          <Suspense>
            <CopilotBubble />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
