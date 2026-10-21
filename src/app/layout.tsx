import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BRAND_RED } from "@/lib/brand";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for headings (`font-heading`).
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Makes og:image and other metadata URLs absolute, as link previews require.
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "WishWall — group cards for the people you love",
    template: "%s · WishWall",
  },
  description:
    "Create a board for a birthday, farewell or any occasion, invite everyone to add a message, then reveal it as a beautiful animated card.",
  // Home-screen app on iOS: full screen, named "WishWall" under the icon.
  appleWebApp: { capable: true, title: "WishWall", statusBarStyle: "default" },
};

// Colours the phone's status bar / browser toolbar.
export const viewport: Viewport = { themeColor: BRAND_RED };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
