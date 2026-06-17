import type { Metadata } from "next";
import { PropsWithChildren } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { AppToaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scooter Rental HQ",
  description: "Internal scooter rental management dashboard"
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
          <AppToaster />
        </AuthProvider>
      </body>
    </html>
  );
}
