import Link from 'next/link'
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
import type { Sale } from '@/lib/supabase/types'

export default async function SalesPage() {
  const supabase = await createClient()

  const { data: sales, error } = await supabase
    .from('sales')
    .select('*, customer:customers(name)')
    .order('sale_date', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching sales:', error)
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
      <div className="flex items-center justify-between">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Sales
          </CardTitle>
          <CardDescription>
            {sales?.length || 0} sale{sales?.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sales || sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No sales recorded yet</p>
              <Button asChild>
                <Link href="/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Sale
                </Link>
              </Button>
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
                {sales.map((sale: Sale & { customer: { name: string } | null }) => (
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
