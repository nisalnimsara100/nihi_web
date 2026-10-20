import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Sinhala } from "next/font/google";
import { Suspense } from "react";
import "goey-toast/styles.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa";
import { AppToaster, FlashToast } from "@/components/toast";
import { readFlash } from "@/lib/flash";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Inter has no Sinhala letters; this font fills in wherever the text is Sinhala.
const sinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "NiHi", template: "%s · NiHi" },
  description: "NiHi is a simple personal finance tracker for your accounts, spending and income.",
  applicationName: "NiHi",
  appleWebApp: { capable: true, title: "NiHi", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

/** Shows the one-time message a redirecting Server Action left behind. */
async function FlashMessage() {
  const flash = await readFlash();
  return flash ? <FlashToast flash={flash} /> : null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sinhala.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <AppToaster />
        <ServiceWorkerRegister />
        <Suspense>
          <FlashMessage />
        </Suspense>
      </body>
    </html>
  );
}
