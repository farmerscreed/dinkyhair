'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  Boxes,
  Tags,
  Sparkles,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  name: string
  icon: React.ComponentType<{ className?: string }>
  children: NavItem[]
  gradient: string
  glowColor: string
}

const navigation: (NavItem | NavGroup)[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Stock Room',
    icon: Package,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    children: [
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Batches', href: '/inventory/batches', icon: Boxes },
      { name: 'Categories', href: '/inventory/categories', icon: Tags },
    ],
  },
  {
    name: 'Operations',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    children: [
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Production', href: '/production', icon: Factory },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    name: 'The Circle',
    icon: Users,
    gradient: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    children: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
      { name: 'Wig Makers', href: '/wig-makers', icon: Scissors },
    ],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  },
]

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'children' in item
}

export function Sidebar() {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    // Auto-expand group containing current path
    for (const item of navigation) {
      if (isNavGroup(item)) {
        if (item.children.some(child => pathname.startsWith(child.href))) {
          return [item.name]
        }
      }
    }
    return []
  })

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const isGroupActive = (group: NavGroup) => {
    return group.children.some(child =>
      pathname === child.href || pathname.startsWith(child.href + '/')
    )
  }

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-50">
      {/* Glass morphism background with depth */}
      <div className="flex min-h-0 flex-1 flex-col relative">
        {/* Layered background for 3D depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

        {/* Animated ambient glow */}
        <div className="absolute top-20 -left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4 relative z-10">
          {/* Logo with 3D effect */}
          <div className="flex flex-shrink-0 items-center px-6 mb-2">
            <div className="relative group cursor-pointer">
              {/* Logo glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative">
                <h1 className="text-3xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(139,92,246,0.5)]">
                    Dinky
                  </span>
                  <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                    Hair
                  </span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mt-1">
                  Management Suite
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 space-y-2 px-4">
            {navigation.map((item) => {
              if (isNavGroup(item)) {
                const isExpanded = expandedGroups.includes(item.name)
                const isActive = isGroupActive(item)

                return (
                  <div key={item.name} className="space-y-1">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={cn(
                        'group relative w-full flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300',
                        isActive || isExpanded
                          ? 'text-white'
                          : 'text-white/60 hover:text-white'
                      )}
                    >
                      {/* 3D Button Background */}
                      <div className={cn(
                        'absolute inset-0 rounded-2xl transition-all duration-300',
                        isActive || isExpanded
                          ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                          : 'bg-white/5 group-hover:bg-white/10'
                      )}
                      style={{
                        boxShadow: isActive || isExpanded
                          ? `0 10px 40px -10px ${item.glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : 'none',
                        transform: isActive || isExpanded ? 'translateY(-1px)' : 'none',
                      }}
                      />

                      {/* Inner highlight for 3D effect */}
                      {(isActive || isExpanded) && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                      )}

                      <div className="relative flex items-center">
                        <div className={cn(
                          'p-2 rounded-xl mr-3 transition-all duration-300',
                          isActive || isExpanded
                            ? 'bg-white/20 shadow-inner'
                            : 'bg-white/5 group-hover:bg-white/10'
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="tracking-wide">{item.name}</span>
                      </div>

                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="relative"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </button>

                    {/* Submenu */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="relative ml-4 pl-4 py-2 space-y-1">
                            {/* Vertical line connector */}
                            <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

                            {item.children.map((child, idx) => {
                              const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')

                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className="group relative block"
                                >
                                  <motion.div
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                      'relative flex items-center rounded-xl px-4 py-2.5 text-sm transition-all duration-200',
                                      isChildActive
                                        ? 'text-white bg-white/10'
                                        : 'text-white/50 hover:text-white hover:bg-white/5'
                                    )}
                                  >
                                    {/* Active indicator dot */}
                                    <div className={cn(
                                      'absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-200',
                                      isChildActive
                                        ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                                        : 'bg-white/20 group-hover:bg-white/40'
                                    )}
                                    style={{
                                      boxShadow: isChildActive ? `0 0 10px ${item.glowColor}` : 'none'
                                    }}
                                    />

                                    <child.icon className={cn(
                                      'h-4 w-4 mr-3 transition-colors duration-200',
                                      isChildActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                                    )} />
                                    <span>{child.name}</span>
                                  </motion.div>
                                </Link>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              // Single nav item (Dashboard, Settings)
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative block"
                >
                  <div className={cn(
                    'relative flex items-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  )}>
                    {/* Background */}
                    <div className={cn(
                      'absolute inset-0 rounded-2xl transition-all duration-300',
                      isActive
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800'
                        : 'bg-transparent group-hover:bg-white/5'
                    )}
                    style={{
                      boxShadow: isActive
                        ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px -5px rgba(0,0,0,0.5)'
                        : 'none',
                    }}
                    />

                    {/* Shine effect on active */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    )}

                    <div className={cn(
                      'relative p-2 rounded-xl mr-3 transition-all duration-300',
                      isActive
                        ? 'bg-white/10'
                        : 'bg-white/5 group-hover:bg-white/10'
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="relative tracking-wide">{item.name}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom card with 3D effect */}
        <div className="relative z-10 p-4">
          <div className="relative overflow-hidden rounded-2xl">
            {/* Card background with depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />

            {/* Animated shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Pro Plan</span>
                <span className="text-[10px] text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                  Active
                </span>
              </div>
              <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 w-2/3 rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 animate-[shimmer_2s_infinite]" />
              </div>
              <p className="text-[10px] text-white/40 mt-2">67% of features used</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
