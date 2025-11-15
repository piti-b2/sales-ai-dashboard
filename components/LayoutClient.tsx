'use client'

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { collapsed } = useSidebar()
  
  // Public pages that don't need Sidebar and Header
  const isPublicPage = pathname === '/login' || pathname === '/forgot-password'
  
  // Chat pages that need full screen without padding
  const isFullScreenPage = pathname === '/chat-v2' || pathname === '/chat'

  // Calculate margin based on sidebar state
  const marginLeft = collapsed ? 'lg:ml-20' : 'lg:ml-64'

  return (
    <>
      {isPublicPage ? (
        // Public layout (no sidebar/header)
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      ) : isFullScreenPage ? (
        // Full screen layout (for chat)
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className={`flex-1 flex flex-col ${marginLeft} overflow-hidden transition-all duration-300`}>
            <Header />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      ) : (
        // Dashboard layout (with sidebar/header)
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className={`flex-1 flex flex-col ${marginLeft} transition-all duration-300`}>
            <Header />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  )
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
