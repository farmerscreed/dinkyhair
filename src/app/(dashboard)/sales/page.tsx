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
import { Plus, Eye, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { SearchInput } from '@/components/ui/search-input'
import type { Sale } from '@/lib/supabase/types'

interface SalesPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const { q: searchQuery } = await searchParams
  const supabase = await createClient()

  // First get all sales with customer data
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*, customer:customers(name)')
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

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'in_store': return 'In Store'
      case 'online': return 'Online'
      case 'wholesale': return 'Wholesale'
      default: return channel
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales</h2>
          <p className="text-muted-foreground">
            View sales history and create new sales
          </p>
        </div>
        <Button asChild>
          <Link href="/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <SearchInput placeholder="Search by sale # or customer name..." className="max-w-sm" />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Sales
          </CardTitle>
          <CardDescription>
            {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ' recorded'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No sales match your search' : 'No sales recorded yet'}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/sales/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Your First Sale
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale: Sale & { customer: { name: string } | null }) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium font-mono">
                      {sale.sale_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(sale.sale_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getChannelLabel(sale.sales_channel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPaymentBadgeVariant(sale.payment_method)}>
                        {sale.payment_method.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sales/${sale.id}`}>
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
    </div>
  )
}
