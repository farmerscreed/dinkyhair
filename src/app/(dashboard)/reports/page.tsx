import { createClient } from '@/lib/supabase/server'
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
  Calendar
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export default async function ReportsPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const startOfLastMonth = startOfMonth(subMonths(now, 1))
  const endOfLastMonth = endOfMonth(subMonths(now, 1))

  // Fetch current month sales
  const { data: currentMonthSales } = await supabase
    .from('sales')
    .select('total, sale_date')
    .gte('sale_date', startOfCurrentMonth.toISOString())
    .lte('sale_date', endOfCurrentMonth.toISOString())

  // Fetch last month sales for comparison
  const { data: lastMonthSales } = await supabase
    .from('sales')
    .select('total')
    .gte('sale_date', startOfLastMonth.toISOString())
    .lte('sale_date', endOfLastMonth.toISOString())

  // Fetch all sales for chart (last 6 months)
  const sixMonthsAgo = subMonths(now, 6)
  const { data: allSales } = await supabase
    .from('sales')
    .select('total, sale_date')
    .gte('sale_date', sixMonthsAgo.toISOString())
    .order('sale_date')

  // Fetch top selling products
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('quantity, products(name)')
    .gte('created_at', sixMonthsAgo.toISOString())

  // Fetch production stats
  const { data: productions } = await supabase
    .from('productions')
    .select('status, labor_cost')

  // Fetch customer count
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  // Fetch product count
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Calculate metrics
  const currentMonthTotal = currentMonthSales?.reduce((sum, s) => sum + s.total, 0) || 0
  const lastMonthTotal = lastMonthSales?.reduce((sum, s) => sum + s.total, 0) || 0
  const salesGrowth = lastMonthTotal > 0
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
    : '0'

  const totalSalesCount = currentMonthSales?.length || 0
  const averageOrderValue = totalSalesCount > 0 ? currentMonthTotal / totalSalesCount : 0

  // Process sales data for chart
  const salesByMonth = allSales?.reduce((acc: Record<string, number>, sale) => {
    const month = format(new Date(sale.sale_date), 'MMM yyyy')
    acc[month] = (acc[month] || 0) + sale.total
    return acc
  }, {}) || {}

  const salesChartData = Object.entries(salesByMonth).map(([month, total]) => ({
    month,
    total
  }))

  // Process top products
  type SaleItemWithProduct = { quantity: number; products: { name: string } | { name: string }[] | null }
  const productSales = (saleItems as SaleItemWithProduct[] | null)?.reduce((acc: Record<string, number>, item) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products
    const name = product?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + item.quantity
    return acc
  }, {}) || {}

  const topProducts = Object.entries(productSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // Production metrics
  const productionByStatus = productions?.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {}) || {}

  const totalLaborCost = productions?.reduce((sum, p) => sum + (p.labor_cost || 0), 0) || 0

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
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Business analytics and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMonthTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {parseFloat(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">
              Avg. order: {formatCurrency(averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              In inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Monthly sales revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <SalesChart data={salesChartData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performers in the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <TopProductsChart data={topProducts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <ProductionStats
            byStatus={productionByStatus}
            totalLaborCost={totalLaborCost}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
