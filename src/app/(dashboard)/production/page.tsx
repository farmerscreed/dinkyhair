'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Eye, Factory, Clock, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Production, ProductionStatus } from '@/lib/supabase/types'
import { motion } from 'framer-motion'

export default function ProductionPage() {
  const [productions, setProductions] = useState<(Production & { wig_maker: { name: string } | null; product: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProductions() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('productions')
        .select('*, wig_maker:wig_makers(name), product:products(name)')
        .order('created_at', { ascending: false })

      if (data) setProductions(data as any)
      setLoading(false)
    }
    fetchProductions()
  }, [])

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: ProductionStatus) => {
    const variants: Record<ProductionStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'neon'> = {
      pending: 'secondary',
      in_progress: 'neon',
      completed: 'default',
      cancelled: 'destructive',
    }
    const labels: Record<ProductionStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const filterByStatus = (status: ProductionStatus | 'all') => {
    if (status === 'all') return productions
    return productions.filter((p) => p.status === status)
  }

  const pendingCount = filterByStatus('pending').length
  const inProgressCount = filterByStatus('in_progress').length
  const completedCount = filterByStatus('completed').length

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Production</h2>
          <p className="text-muted-foreground mt-1">
            Track wig production orders and assignments
          </p>
        </div>
        <Button asChild size="lg" variant="neon" className="shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)]">
          <Link href="/production/new">
            <Plus className="mr-2 h-5 w-5" />
            New Production Order
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-secondary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-secondary opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Orders waiting to start</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-primary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <Factory className="h-4 w-4 text-primary opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">Currently being made</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-emerald-500 hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Finished this month</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10 p-1 backdrop-blur-md">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">Pending</TabsTrigger>
            <TabsTrigger value="in_progress" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">Completed</TabsTrigger>
          </TabsList>

          {(['all', 'pending', 'in_progress', 'completed'] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="glass overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-primary" />
                    Production Orders
                  </CardTitle>
                  <CardDescription>
                    {filterByStatus(tab).length} order{filterByStatus(tab).length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {filterByStatus(tab).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 m-4 rounded-lg border border-dashed border-white/10">
                      <p className="text-muted-foreground mb-4">No production orders found</p>
                      {tab === 'all' && (
                        <Button asChild variant="secondary">
                          <Link href="/production/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Production Order
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60 pl-6">Order #</TableHead>
                          <TableHead className="text-white/60">Product</TableHead>
                          <TableHead className="text-white/60">Wig Maker</TableHead>
                          <TableHead className="text-white/60">Status</TableHead>
                          <TableHead className="text-white/60">Start Date</TableHead>
                          <TableHead className="text-white/60">Expected</TableHead>
                          <TableHead className="text-right text-white/60">Labor Cost</TableHead>
                          <TableHead className="text-right text-white/60 pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterByStatus(tab).map((production) => (
                          <TableRow key={production.id} className="hover:bg-white/5 border-white/10 transition-colors">
                            <TableCell className="font-mono text-primary font-medium pl-6">
                              {production.production_number}
                            </TableCell>
                            <TableCell className="font-medium text-white/90">{production.product?.name || '-'}</TableCell>
                            <TableCell className="text-white/80">{production.wig_maker?.name || 'Unassigned'}</TableCell>
                            <TableCell>{getStatusBadge(production.status)}</TableCell>
                            <TableCell className="text-white/70">
                              {production.start_date
                                ? format(new Date(production.start_date), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-white/70">
                              {production.expected_completion
                                ? format(new Date(production.expected_completion), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right text-white/80 font-mono">
                              {formatCurrency(production.labor_cost)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button variant="ghost" size="icon-sm" asChild className="hover:bg-white/10 hover:text-primary">
                                <Link href={`/production/${production.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
