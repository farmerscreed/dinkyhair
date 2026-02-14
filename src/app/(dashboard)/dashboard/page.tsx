import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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
import { Package, ShoppingCart, Factory, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import type { Product, Sale } from '@/lib/supabase/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // Fetch dashboard data in parallel
  const [
    productsResult,
    todaySalesResult,
    monthSalesResult,
    productionResult,
    recentSalesResult,
    lowStockResult,
  ] = await Promise.all([
    // Total active products
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),

    // Today's sales
    supabase
      .from('sales')
      .select('total')
      .gte('sale_date', todayStart.toISOString())
      .lte('sale_date', todayEnd.toISOString()),

    // This month's sales
    supabase
      .from('sales')
      .select('total')
      .gte('sale_date', monthStart.toISOString())
      .lte('sale_date', monthEnd.toISOString()),

    // Active productions
    supabase
      .from('productions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']),

    // Recent sales
    supabase
      .from('sales')
      .select('*, customer:customers(name)')
      .order('sale_date', { ascending: false })
      .limit(5),

    // Low stock products
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('quantity_in_stock')
      .limit(10),
  ])

  // Calculate metrics
  const totalProducts = productsResult.count || 0
  const todaySalesCount = todaySalesResult.data?.length || 0
  const todaySalesTotal = todaySalesResult.data?.reduce((sum, s) => sum + s.total, 0) || 0
  const monthRevenue = monthSalesResult.data?.reduce((sum, s) => sum + s.total, 0) || 0
  const activeProductions = productionResult.count || 0

  // Filter actual low stock items
  const lowStockProducts = (lowStockResult.data || []).filter(
    (p: Product) => p.quantity_in_stock <= p.reorder_level
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to DinkyHair Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySalesCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(todaySalesTotal)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProductions}</div>
            <p className="text-xs text-muted-foreground">
              Active orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {format(now, 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-400">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} at or below reorder level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map((product: Product) => (
                <Badge key={product.id} variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                  {product.name}: {product.quantity_in_stock} left
                </Badge>
              ))}
              {lowStockProducts.length > 5 && (
                <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                  +{lowStockProducts.length - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                Latest transactions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sales">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentSalesResult.data || recentSalesResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sales recorded yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSalesResult.data.map((sale: Sale & { customer: { name: string } | null }) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">
                        {sale.sale_number}
                      </TableCell>
                      <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="justify-start">
              <Link href="/sales/new">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New Sale
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/inventory/new">
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/production/new">
                <Factory className="mr-2 h-4 w-4" />
                New Production Order
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
