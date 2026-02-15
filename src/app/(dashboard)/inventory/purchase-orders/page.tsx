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
import { Plus, Pencil, ArrowLeft, Package } from 'lucide-react'
import { format } from 'date-fns'
import type { Batch } from '@/lib/supabase/types'

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()

  const { data: batches, error } = await supabase
    .from('batches')
    .select('*, supplier:suppliers(name), items:batch_items(id)')
    .order('purchase_date', { ascending: false })

  if (error) {
    console.error('Error fetching purchase orders:', error)
  }

  const formatCurrency = (amount: number | null, currency: 'USD' | 'NGN' = 'NGN') => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
            <p className="text-muted-foreground">
              Track purchases from suppliers
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventory/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Purchase Orders
          </CardTitle>
          <CardDescription>
            {batches?.length || 0} purchase order{batches?.length !== 1 ? 's' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!batches || batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No purchase orders recorded yet</p>
              <Button asChild>
                <Link href="/inventory/purchase-orders/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Purchase Order
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Cost (USD)</TableHead>
                  <TableHead className="text-right">Cost (NGN)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch: Batch & { supplier: { name: string } | null; items: { id: string }[] }) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium font-mono">
                      {batch.batch_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={batch.status === 'received' ? 'default' : 'secondary'}>
                        {batch.status === 'received' ? 'Received' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(batch.purchase_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{batch.supplier?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {batch.items?.length || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(batch.total_cost_usd, 'USD')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(batch.total_cost_ngn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/purchase-orders/${batch.id}`}>
                          <Pencil className="h-4 w-4" />
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
