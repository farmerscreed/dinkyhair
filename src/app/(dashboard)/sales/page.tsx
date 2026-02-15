import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
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
import { Plus, Eye, ShoppingCart, Search, CreditCard, Banknote, Smartphone, Globe, Store } from 'lucide-react'
import { format } from 'date-fns'
import { SearchInput } from '@/components/ui/search-input'
import type { Sale } from '@/lib/supabase/types'

interface SalesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const { q: searchQuery } = await searchParams
  const supabase = await createClient()

  // Get all sales with customer data and sale items for profit calculation
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*, customer:customers(name), sale_items(quantity, unit_price, product:products(cost_price_ngn))')
    .order('sale_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching sales:', error)
  }

  // Filter in-memory for customer name search since we're joining
  let filteredSales = sales || []
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredSales = filteredSales.filter((sale: Sale & { customer: { name: string } | null }) =>
      sale.sale_number?.toLowerCase().includes(query) ||
      sale.customer?.name?.toLowerCase().includes(query)
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPaymentBadgeVariant = (method: string) => {
    switch (method) {
      case 'cash': return 'default'
      case 'transfer': return 'secondary'
      case 'pos': return 'outline'
      case 'credit': return 'destructive'
      default: return 'default'
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-3 w-3 mr-1" />
      case 'transfer': return <Smartphone className="h-3 w-3 mr-1" />
      case 'pos': return <CreditCard className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  const calculateProfit = (sale: any) => {
    if (!sale.sale_items || sale.sale_items.length === 0) return null
    const costOfGoods = sale.sale_items.reduce((sum: number, item: any) => {
      const costPrice = item.product?.cost_price_ngn || 0
      return sum + (costPrice * item.quantity)
    }, 0)
    return sale.total - costOfGoods
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'in_store': return 'In Store'
      case 'online': return 'Online'
      case 'wholesale': return 'Wholesale'
      default: return channel
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'in_store': return <Store className="h-3 w-3 mr-1" />
      case 'online': return <Globe className="h-3 w-3 mr-1" />
      default: return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-card/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text">Sales</h2>
          <p className="text-muted-foreground mt-1">
            View sales history and create new sales
          </p>
        </div>
        <Button asChild variant="neon" size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/sales/new">
            <Plus className="mr-2 h-5 w-5" />
            New Sale
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Suspense fallback={null}>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SearchInput placeholder="Search by sale # or customer..." className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 text-white w-full" />
          </div>
        </Suspense>
      </div>

      <Card className="glass border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Recent Sales
          </CardTitle>
          <CardDescription>
            {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ' recorded'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-xl border border-white/5 border-dashed m-4">
              <p className="text-muted-foreground mb-6 text-lg">
                {searchQuery ? 'No sales match your search' : 'No sales recorded yet'}
              </p>
              {!searchQuery && (
                <Button asChild variant="neon">
                  <Link href="/sales/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Your First Sale
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/70">Sale #</TableHead>
                    <TableHead className="text-white/70">Date</TableHead>
                    <TableHead className="text-white/70">Customer</TableHead>
                    <TableHead className="text-white/70">Channel</TableHead>
                    <TableHead className="text-white/70">Payment</TableHead>
                    <TableHead className="text-right text-white/70">Total</TableHead>
                    <TableHead className="text-right text-white/70">Profit</TableHead>
                    <TableHead className="text-right text-white/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale: Sale & { customer: { name: string } | null }) => (
                    <TableRow key={sale.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                      <TableCell className="font-medium font-mono text-primary group-hover:text-primary/80 transition-colors">
                        {sale.sale_number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sale.sale_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-white">{sale.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/20 flex w-fit items-center">
                          {getChannelIcon(sale.sales_channel)}
                          {getChannelLabel(sale.sales_channel)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPaymentBadgeVariant(sale.payment_method)} className="flex w-fit items-center">
                          {getPaymentIcon(sale.payment_method)}
                          {sale.payment_method.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-white text-lg">
                        {formatCurrency(sale.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const profit = calculateProfit(sale)
                          if (profit === null) return <span className="text-muted-foreground">-</span>
                          return (
                            <span className={profit >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                              {formatCurrency(profit)}
                            </span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/20 hover:text-primary">
                          <Link href={`/sales/${sale.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
