'use client'

import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { usePathname } from "next/navigation";

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai", "latin"],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  
  // Public pages that don't need Sidebar and Header
  const isPublicPage = pathname === '/login' || pathname === '/forgot-password'

  return (
    <html lang="en">
      <body className={`${prompt.className} antialiased`}>
        {isPublicPage ? (
          // Public layout (no sidebar/header)
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        ) : (
          // Dashboard layout (with sidebar/header)
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col lg:ml-64">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
