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
import { Plus, Pencil, ArrowLeft, Package } from 'lucide-react'
import { format } from 'date-fns'
import type { Batch } from '@/lib/supabase/types'

export default async function BatchesPage() {
  const supabase = await createClient()

  const { data: batches, error } = await supabase
    .from('batches')
    .select('*, supplier:suppliers(name)')
    .order('purchase_date', { ascending: false })

  if (error) {
    console.error('Error fetching batches:', error)
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
            <h2 className="text-2xl font-bold tracking-tight">Purchase Batches</h2>
            <p className="text-muted-foreground">
              Track hair purchases from suppliers
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/inventory/batches/new">
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Batches
          </CardTitle>
          <CardDescription>
            {batches?.length || 0} batch{batches?.length !== 1 ? 'es' : ''} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!batches || batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No batches recorded yet</p>
              <Button asChild>
                <Link href="/inventory/batches/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Batch
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Cost (USD)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Cost (NGN)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch: Batch & { supplier: { name: string } | null }) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium font-mono">
                      {batch.batch_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(batch.purchase_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{batch.supplier?.name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(batch.total_cost_usd, 'USD')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {batch.exchange_rate ? `₦${batch.exchange_rate.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(batch.total_cost_ngn)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inventory/batches/${batch.id}`}>
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
