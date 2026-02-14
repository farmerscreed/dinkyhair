'use client'

import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, ShoppingCart, Factory, TrendingUp, AlertTriangle, ArrowRight, Plus } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from 'date-fns'
import type { Product, Sale } from '@/lib/supabase/types'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { OverviewChart } from '@/components/dashboard/overview-chart'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    productsCount: number
    todaySalesCount: number
    todaySalesTotal: number
    monthRevenue: number
    activeProductions: number
    lowStockProducts: Product[]
    recentSales: (Sale & { customer: { name: string } | null })[]
    chartData: { name: string; total: number }[]
  }>({
    productsCount: 0,
    todaySalesCount: 0,
    todaySalesTotal: 0,
    monthRevenue: 0,
    activeProductions: 0,
    lowStockProducts: [],
    recentSales: [],
    chartData: [],
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)
      const sevenDaysAgo = subDays(now, 7)

      const [
        productsResult,
        todaySalesResult,
        monthSalesResult,
        productionResult,
        recentSalesResult,
        lowStockResult,
        chartSalesResult
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('sales').select('total').gte('sale_date', todayStart.toISOString()).lte('sale_date', todayEnd.toISOString()),
        supabase.from('sales').select('total').gte('sale_date', monthStart.toISOString()).lte('sale_date', monthEnd.toISOString()),
        supabase.from('productions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
        supabase.from('sales').select('*, customer:customers(name)').order('sale_date', { ascending: false }).limit(5),
        supabase.from('products').select('*').eq('is_active', true).order('quantity_in_stock').limit(10),
        supabase.from('sales').select('sale_date, total').gte('sale_date', sevenDaysAgo.toISOString()).order('sale_date', { ascending: true })
      ])

      const lowStock = (lowStockResult.data || []).filter((p: Product) => p.quantity_in_stock <= p.reorder_level)

      // Process chart data: Group by day
      const chartDataMap = new Map<string, number>()
      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const d = subDays(now, i)
        chartDataMap.set(format(d, 'MMM dd'), 0)
      }

      chartSalesResult.data?.forEach((sale: any) => {
        const dateKey = format(new Date(sale.sale_date), 'MMM dd')
        if (chartDataMap.has(dateKey)) {
          chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + sale.total)
        }
      })

      const chartData = Array.from(chartDataMap.entries()).map(([name, total]) => ({ name, total }))

      setData({
        productsCount: productsResult.count || 0,
        todaySalesCount: todaySalesResult.data?.length || 0,
        todaySalesTotal: todaySalesResult.data?.reduce((sum, s) => sum + s.total, 0) || 0,
        monthRevenue: monthSalesResult.data?.reduce((sum, s) => sum + s.total, 0) || 0,
        activeProductions: productionResult.count || 0,
        lowStockProducts: lowStock,
        recentSales: (recentSalesResult.data as any) || [],
        chartData
      })
      setLoading(false)
    }

    fetchData()
  }, [])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
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
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back to DinkyHair Management System
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-primary/20 hover:bg-primary/40 text-primary-foreground border-primary/50 border">
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" /> New Sale
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-primary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Package className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.productsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active in inventory
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-secondary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales Today</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-full">
                <ShoppingCart className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.todaySalesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(data.todaySalesTotal)} total
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-accent hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Production</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <Factory className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{data.activeProductions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active orders
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-emerald-500 hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatCurrency(data.monthRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(), 'MMMM yyyy')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chart Section */}
      <motion.div variants={item}>
        <OverviewChart data={data.chartData} />
      </motion.div>

      {/* Low Stock Alert */}
      {data.lowStockProducts.length > 0 && (
        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-orange-500/50 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription className="text-orange-400/70">
                {data.lowStockProducts.length} product{data.lowStockProducts.length !== 1 ? 's' : ''} at or below reorder level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.lowStockProducts.slice(0, 5).map((product: Product) => (
                  <Badge key={product.id} variant="outline" className="border-orange-500/30 text-orange-300 bg-orange-500/10">
                    {product.name}: {product.quantity_in_stock} left
                  </Badge>
                ))}
                {data.lowStockProducts.length > 5 && (
                  <Badge variant="outline" className="border-orange-500/30 text-orange-300 bg-orange-500/10">
                    +{data.lowStockProducts.length - 5} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="glass h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Sales</CardTitle>
                <CardDescription>
                  Latest transactions
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="hover:bg-white/10 text-primary">
                <Link href="/sales">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {!data.recentSales || data.recentSales.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center bg-white/5 rounded-lg border border-white/5 border-dashed">
                  No sales recorded yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-white/5 border-white/10">
                      <TableHead className="text-white/60">Sale #</TableHead>
                      <TableHead className="text-white/60">Customer</TableHead>
                      <TableHead className="text-right text-white/60">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-white/5 border-white/10 group cursor-default">
                        <TableCell className="font-mono text-sm text-primary/80 group-hover:text-primary transition-colors">
                          {sale.sale_number}
                        </TableCell>
                        <TableCell className="font-medium text-white/80">{sale.customer?.name || 'Walk-in'}</TableCell>
                        <TableCell className="text-right text-white/80 font-bold">
                          {formatCurrency(sale.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 bg-white/5 hover:bg-primary/20 hover:border-primary/50 [&_svg]:size-6 border-white/10 transition-all duration-300 group">
                <Link href="/sales/new">
                  <ShoppingCart className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-lg">New Sale</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 bg-white/5 hover:bg-secondary/20 hover:border-secondary/50 [&_svg]:size-6 border-white/10 transition-all duration-300 group">
                <Link href="/inventory/new">
                  <Package className="text-muted-foreground group-hover:text-secondary transition-colors" />
                  <span className="text-lg">Add Product</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 bg-white/5 hover:bg-accent/20 hover:border-accent/50 [&_svg]:size-6 border-white/10 transition-all duration-300 group">
                <Link href="/production/new">
                  <Factory className="text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-lg">New Order</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 bg-white/5 hover:bg-white/20 hover:border-white/30 [&_svg]:size-6 border-white/10 transition-all duration-300 group">
                <Link href="/reports">
                  <TrendingUp className="text-muted-foreground group-hover:text-white transition-colors" />
                  <span className="text-lg">Reports</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
