import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Taze Creative Attendance Dashboard",
  description: "Attendance and leave management dashboard for Taze Creative.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
