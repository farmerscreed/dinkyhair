'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, DialogPanel, DialogTitle, DialogDescription, Transition, TransitionChild } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  X,
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
    children: [
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Purchase Orders', href: '/inventory/purchase-orders', icon: Boxes },
      { name: 'Categories', href: '/inventory/categories', icon: Tags },
    ],
  },
  {
    name: 'Operations',
    icon: Sparkles,
    gradient: 'from-amber-500 to-orange-600',
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

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
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
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex">
          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-m-2.5 text-white hover:text-primary hover:bg-white/10"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </TransitionChild>

              <div className="flex grow flex-col overflow-y-auto relative">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/98 to-black" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

                {/* Ambient glow */}
                <div className="absolute top-20 -left-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex grow flex-col gap-y-5 px-5 pb-4">
                  {/* Logo */}
                  <div className="flex h-16 shrink-0 items-center pt-2">
                    <div className="relative">
                      <DialogTitle className="text-2xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                          Dinky
                        </span>
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                          Hair
                        </span>
                      </DialogTitle>
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">
                        Management Suite
                      </p>
                    </div>
                  </div>

                  <DialogDescription className="sr-only">
                    Navigation menu for DinkyHair management system
                  </DialogDescription>

                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-2">
                      {navigation.map((item) => {
                        if (isNavGroup(item)) {
                          const isExpanded = expandedGroups.includes(item.name)
                          const isActive = isGroupActive(item)

                          return (
                            <li key={item.name}>
                              <button
                                onClick={() => toggleGroup(item.name)}
                                className={cn(
                                  'group relative w-full flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                                  isActive || isExpanded
                                    ? 'text-white'
                                    : 'text-white/60'
                                )}
                              >
                                {/* Background */}
                                <div className={cn(
                                  'absolute inset-0 rounded-2xl transition-all duration-300',
                                  isActive || isExpanded
                                    ? `bg-gradient-to-r ${item.gradient}`
                                    : 'bg-white/5'
                                )}
                                style={{
                                  boxShadow: isActive || isExpanded
                                    ? 'inset 0 1px 0 rgba(255,255,255,0.2)'
                                    : 'none'
                                }}
                                />

                                {(isActive || isExpanded) && (
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                )}

                                <div className="relative flex items-center">
                                  <div className={cn(
                                    'p-2 rounded-xl mr-3',
                                    isActive || isExpanded ? 'bg-white/20' : 'bg-white/5'
                                  )}>
                                    <item.icon className="h-5 w-5" />
                                  </div>
                                  <span>{item.name}</span>
                                </div>

                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="relative"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </motion.div>
                              </button>

                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="relative ml-4 pl-4 py-2 space-y-1">
                                      <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

                                      {item.children.map((child) => {
                                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')

                                        return (
                                          <li key={child.name}>
                                            <Link
                                              href={child.href}
                                              onClick={onClose}
                                              className={cn(
                                                'relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200',
                                                isChildActive
                                                  ? 'text-white bg-white/10'
                                                  : 'text-white/50'
                                              )}
                                            >
                                              <div className={cn(
                                                'absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full',
                                                isChildActive
                                                  ? `bg-gradient-to-r ${item.gradient}`
                                                  : 'bg-white/20'
                                              )} />
                                              <child.icon className="h-4 w-4" />
                                              {child.name}
                                            </Link>
                                          </li>
                                        )
                                      })}
                                    </div>
                                  </motion.ul>
                                )}
                              </AnimatePresence>
                            </li>
                          )
                        }

                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                'group relative flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                                isActive
                                  ? 'text-white'
                                  : 'text-white/60'
                              )}
                            >
                              <div className={cn(
                                'absolute inset-0 rounded-2xl transition-all duration-300',
                                isActive
                                  ? 'bg-gradient-to-r from-slate-700 to-slate-800'
                                  : 'bg-transparent'
                              )}
                              style={{
                                boxShadow: isActive
                                  ? 'inset 0 1px 0 rgba(255,255,255,0.1)'
                                  : 'none'
                              }}
                              />

                              <div className={cn(
                                'relative p-2 rounded-xl mr-3',
                                isActive ? 'bg-white/10' : 'bg-white/5'
                              )}>
                                <item.icon className="h-5 w-5" />
                              </div>
                              <span className="relative">{item.name}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>

                  {/* Bottom card */}
                  <div className="relative overflow-hidden rounded-2xl mt-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-cyan-600/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />

                    <div className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Pro Plan</span>
                        <span className="text-[10px] text-cyan-400 font-medium px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                          Active
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 w-2/3 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
