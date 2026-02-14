'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalesChart } from './_components/sales-chart'
import { TopProductsChart } from './_components/top-products-chart'
import { ProductionStats } from './_components/production-stats'
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    currentMonthTotal: 0,
    salesGrowth: '0',
    totalSalesCount: 0,
    averageOrderValue: 0,
    productCount: 0,
    customerCount: 0,
    salesChartData: [],
    topProducts: [],
    productionByStatus: {},
    totalLaborCost: 0
  })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const now = new Date()
      const startOfCurrentMonth = startOfMonth(now)
      const endOfCurrentMonth = endOfMonth(now)
      const startOfLastMonth = startOfMonth(subMonths(now, 1))
      const endOfLastMonth = endOfMonth(subMonths(now, 1))
      const sixMonthsAgo = subMonths(now, 6)

      const [
        currentMonthSales,
        lastMonthSales,
        allSales,
        saleItems,
        productions,
        customerRes,
        productRes
      ] = await Promise.all([
        supabase.from('sales').select('total').gte('sale_date', startOfCurrentMonth.toISOString()).lte('sale_date', endOfCurrentMonth.toISOString()),
        supabase.from('sales').select('total').gte('sale_date', startOfLastMonth.toISOString()).lte('sale_date', endOfLastMonth.toISOString()),
        supabase.from('sales').select('total, sale_date').gte('sale_date', sixMonthsAgo.toISOString()).order('sale_date'),
        supabase.from('sale_items').select('quantity, products(name)').gte('created_at', sixMonthsAgo.toISOString()),
        supabase.from('productions').select('status, labor_cost'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      const currentMonthTotal = currentMonthSales.data?.reduce((sum, s) => sum + s.total, 0) || 0
      const lastMonthTotal = lastMonthSales.data?.reduce((sum, s) => sum + s.total, 0) || 0
      const salesGrowth = lastMonthTotal > 0
        ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : '0'

      const totalSalesCount = currentMonthSales.data?.length || 0
      const averageOrderValue = totalSalesCount > 0 ? currentMonthTotal / totalSalesCount : 0

      const salesByMonth = allSales.data?.reduce((acc: Record<string, number>, sale) => {
        const month = format(new Date(sale.sale_date), 'MMM yyyy')
        acc[month] = (acc[month] || 0) + sale.total
        return acc
      }, {}) || {}

      const salesChartData = Object.entries(salesByMonth).map(([month, total]) => ({
        month,
        total
      }))

      const productSales = (saleItems.data as any[])?.reduce((acc: Record<string, number>, item) => {
        const product = Array.isArray(item.products) ? item.products[0] : item.products
        const name = product?.name || 'Unknown'
        acc[name] = (acc[name] || 0) + item.quantity
        return acc
      }, {}) || {}

      const topProducts = Object.entries(productSales)
        .map(([name, quantity]: [string, any]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      const productionByStatus = productions.data?.reduce((acc: Record<string, number>, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {}) || {}

      const totalLaborCost = productions.data?.reduce((sum, p) => sum + (p.labor_cost || 0), 0) || 0

      setData({
        currentMonthTotal,
        salesGrowth,
        totalSalesCount,
        averageOrderValue,
        productCount: productRes.count || 0,
        customerCount: customerRes.count || 0,
        salesChartData,
        topProducts,
        productionByStatus,
        totalLaborCost
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
      <motion.div variants={item}>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Reports</h2>
        <p className="text-muted-foreground mt-1">
          Business analytics and performance metrics
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-primary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(data.currentMonthTotal)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {parseFloat(data.salesGrowth) >= 0 ? '+' : ''}{data.salesGrowth}% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-secondary hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sales This Month</CardTitle>
              <div className="p-2 bg-secondary/10 rounded-full">
                <ShoppingCart className="h-4 w-4 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.totalSalesCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg. order: {formatCurrency(data.averageOrderValue)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-accent hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
              <div className="p-2 bg-accent/10 rounded-full">
                <Package className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.productCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In inventory
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass border-l-4 border-l-emerald-500 hover:scale-[1.02] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <Users className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{data.customerCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered customers
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10 p-1 backdrop-blur-md">
            <TabsTrigger value="sales" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Sales</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">Products</TabsTrigger>
            <TabsTrigger value="production" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">Production</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Monthly sales revenue over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <SalesChart data={data.salesChartData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers in the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <TopProductsChart data={data.topProducts} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <ProductionStats
              byStatus={data.productionByStatus}
              totalLaborCost={data.totalLaborCost}
              formatCurrency={formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
