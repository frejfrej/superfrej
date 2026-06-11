import type { Metadata } from "next";
import { Fraunces, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Superfrej", template: "%s · Superfrej" },
  description:
    "Vacation-rental PMS and channel manager — calendar, reservations, guests, payments and OTA sync in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${schibsted.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="paper-grain flex-1 px-8 py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
