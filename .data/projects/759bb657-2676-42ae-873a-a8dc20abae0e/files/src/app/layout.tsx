import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { ClerkProvider } from "@clerk/nextjs";



import UserSync from "@/components/UserSync";
import TanStackProviders from "@/components/providers/TanStackProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dentwise - AI Powered Dental Assistant",
  description: "Get instant dental advise with out AI assistant 24/7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TanStackProviders>
      <ClerkProvider
        appearance={
          {
           variables: {
            colorPrimary: "#e78a53",
            colorBackground: "#f3f4f6",
          }
          }
        } >
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
          >
            <UserSync />
            {children}
          </body>
        </html>
      </ClerkProvider>
    </TanStackProviders>
  );
}
