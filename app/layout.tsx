import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { AppFooter } from "@/components/AppFooter";
import { BottomNav } from "@/components/BottomNav";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Suits Made Simple — Premium Suits for the Modern Gentleman",
    template: "%s — Suits Made Simple",
  },
  description:
    "Distinction in every detail. Premium corporate and casual suits tailored for the modern gentleman.",
  applicationName: "Suits Made Simple",
  appleWebApp: {
    capable: true,
    title: "Suits Made Simple",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#3B4654",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sms_theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            {/* AppFooter renders null inside the Capacitor shell */}
            <AppFooter />
            <BottomNav />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
