import type { Metadata } from "next";
import FloatingLiveChatButton from "@/components/support/FloatingLiveChatButton";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "STN Commerce",
  description: "Food, hardware, premium, and digital commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
          <FloatingLiveChatButton />
        </SessionProvider>
      </body>
    </html>
  );
}