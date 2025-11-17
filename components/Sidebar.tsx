'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronDown,
  Menu,
  Brain,
  Zap,
  BarChart3,
  Sparkles,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'

interface SubMenuItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
}

interface MenuItem {
  name: string
  href?: string
  icon: React.ElementType
  submenu?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Real-time Data', href: '/dashboard', icon: BarChart3 },
  { name: 'AI Insights', href: '/ai-insights', icon: Brain },
  { name: 'Predictions', href: '/predictive', icon: Zap },
  { 
    name: 'Chat', 
    icon: MessageSquare,
    submenu: [
      { name: 'Messages', href: '/messages', icon: BarChart3 },
      { name: 'LINE', href: '/chat-v2', icon: MessageSquare },
      { name: 'Facebook', href: '/chat-v3', icon: MessageSquare, badge: 'Soon' },
    ]
  },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales', href: '/sales', icon: DollarSign },
]

const bottomMenuItems = [
  { 
    name: 'Settings', 
    icon: Settings,
    submenu: [
      { name: 'ทั่วไป', href: '/settings', icon: Settings },
      { name: 'AI Config', href: '/settings/ai-config', icon: Sparkles },
      { name: 'เวลาทำการ', href: '/settings/operating-hours', icon: Clock },
    ]
  },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const pathname = usePathname()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {collapsed ? (
            <Image 
              src="/image/company-logo-1080.png"
              alt="Company Logo"
              width={32}
              height={32}
              className="rounded-lg mx-auto"
            />
          ) : (
            <div className="flex items-center space-x-2">
              <Image 
                src="/image/company-logo-1080.png"
                alt="Company Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg text-black">MAAS</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isSubmenuOpen = openSubmenu === item.name
            const isActive = item.href ? pathname === item.href : false
            const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href)

            return (
              <div key={item.name}>
                {/* Main Menu Item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                      isSubmenuActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          isSubmenuOpen && 'rotate-180'
                        )}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isSubmenuOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu!.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                            isSubActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{subItem.name}</span>
                          </div>
                          {subItem.badge && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 space-y-1 border-t border-gray-200">
          {bottomMenuItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isSubmenuOpen = openSubmenu === item.name
            const isActive = item.href ? pathname === item.href : false
            const isSubmenuActive = item.submenu?.some(sub => pathname === sub.href)

            return (
              <div key={item.name}>
                {/* Main Menu Item */}
                {hasSubmenu ? (
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                      isSubmenuActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.name}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform',
                          isSubmenuOpen && 'rotate-180'
                        )}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isSubmenuOpen && !collapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu!.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
                            isSubActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{subItem.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
