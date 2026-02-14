import Link from 'next/link'
import { notFound } from 'next/navigation'
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
import { ArrowLeft, Printer } from 'lucide-react'
import { format } from 'date-fns'

interface SaleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: sale, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(name, phone, email),
      staff:profiles(full_name),
      items:sale_items(*, product:products(name, sku))
    `)
    .eq('id', id)
    .single()

  if (error || !sale) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sales">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sales
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Sale {sale.sale_number}
            </h2>
            <p className="text-muted-foreground">
              {format(new Date(sale.sale_date), 'MMMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {sale.customer ? (
              <div className="space-y-1">
                <p className="font-medium">{sale.customer.name}</p>
                {sale.customer.phone && (
                  <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>
                )}
                {sale.customer.email && (
                  <p className="text-sm text-muted-foreground">{sale.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Walk-in Customer</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant="outline" className="uppercase">
                {sale.payment_method}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Channel: {sale.sales_channel.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Processed By</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{sale.staff?.full_name || 'Unknown'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {sale.items?.length || 0} item{sale.items?.length !== 1 ? 's' : ''} in this sale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items?.map((item: {
                id: string
                quantity: number
                unit_price: number
                total_price: number
                product: { name: string; sku: string | null } | null
              }) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product?.name || 'Unknown Product'}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono">
                    {item.product?.sku || '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">-{formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {sale.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{sale.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
