'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, DialogPanel, DialogTitle, DialogDescription, Transition, TransitionChild } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

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

              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background/95 backdrop-blur-xl px-6 pb-2 border-r border-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text">DinkyHair</DialogTitle>
                </div>
                <DialogDescription className="sr-only">
                  Navigation menu for DinkyHair management system
                </DialogDescription>
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              'group flex gap-x-3 rounded-xl p-3 text-sm font-medium leading-6 transition-all duration-200',
                              isActive
                                ? 'bg-primary/20 text-primary-foreground border border-primary/20'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                            )}
                          >
                            <item.icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                            {item.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}
