'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChefHat, LayoutDashboard, Megaphone, Menu, MessageSquareText, PlusCircle, ShieldCheck, Utensils, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/Admin')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/Admin')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff1e1]">
        <p className="text-neutral-800">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const menuItems = [
    { href: '/Admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/Admin/dashboard/chef-applications', label: 'Applications', icon: <ChefHat size={20} /> },
    { href: '/Admin/dashboard/restaurants', label: 'Restaurants', icon: <Utensils size={20} /> },
    { href: '/Admin/dashboard/restaurant-claims', label: 'Restaurant Claims', icon: <ShieldCheck size={20} /> },
    { href: '/Admin/dashboard/restaurant-suggestions', label: 'Add Listings', icon: <PlusCircle size={20} /> },
    { href: '/Admin/dashboard/advertising', label: 'Advertising', icon: <Megaphone size={20} /> },
    { href: '/Admin/dashboard/reviews', label: 'Reviews', icon: <MessageSquareText size={20} /> },
  ]

  const isActive = (href: string) => {
    if (href === '/Admin/dashboard/reviews') {
      return (
        pathname === href ||
        pathname.startsWith('/Admin/dashboard/review-moderation') ||
        pathname.startsWith('/Admin/dashboard/flagged-reviews') ||
        pathname.startsWith('/Admin/dashboard/restaurant-reviews')
      )
    }
    return pathname === href
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#fff1e1] border-r border-black text-black transition-all duration-300 ease-in-out flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-black">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">Management</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-white rounded"
            >
              {sidebarOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-[#ff8400] text-white'
                  : 'text-slate-900 hover:bg-[#ff8200]/30'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-black space-y-3">
          {sidebarOpen && admin && (
            <p className="text-xs text-slate-600 truncate">{admin.name}</p>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full px-3 py-2 rounded border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors ${
              !sidebarOpen ? 'px-2 text-xs' : ''
            }`}
            title="Logout"
          >
            {sidebarOpen ? 'Logout' : 'Out'}
          </button>
          {sidebarOpen && (
            <p className="text-xs text-slate-400">© 2024 Admin Panel</p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-end items-center shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
