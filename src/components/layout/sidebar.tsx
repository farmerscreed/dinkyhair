'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Factory,
  Users,
  BarChart3,
  Settings,
  Truck,
  Scissors,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Sales', href: '/sales', icon: ShoppingCart },
  { name: 'Production', href: '/production', icon: Factory },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Wig Makers', href: '/wig-makers', icon: Scissors },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-50">
      <div className="flex min-h-0 flex-1 flex-col border-r border-white/10 bg-sidebar/40 backdrop-blur-xl">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text">
              DinkyHair
            </h1>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-tab"
                      className="absolute inset-0 bg-primary/20 border border-primary/20 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />

                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0 z-10 transition-colors duration-200',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    )}
                  />
                  <span className="z-10">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 border border-white/5">
            <p className="text-xs text-muted-foreground">Pro Plan</p>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
