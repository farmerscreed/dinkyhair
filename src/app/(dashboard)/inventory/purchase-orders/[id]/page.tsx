import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../_components/batch-form'

interface EditPurchaseOrderPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPurchaseOrderPage({ params }: EditPurchaseOrderPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [batchResult, itemsResult, suppliersResult, productsResult, exchangeRateResult] = await Promise.all([
    supabase.from('batches').select('*').eq('id', id).single(),
    supabase.from('batch_items').select('*, product:products(id, name)').eq('batch_id', id),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('exchange_rates').select('rate').order('effective_date', { ascending: false }).limit(1),
  ])

  if (batchResult.error || !batchResult.data) {
    notFound()
  }

  const currentRate = exchangeRateResult.data?.[0]?.rate || null
  const batchWithItems = {
    ...batchResult.data,
    items: itemsResult.data || [],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Purchase Order</h2>
          <p className="text-muted-foreground">
            Update PO {batchResult.data.batch_number}
          </p>
        </div>
      </div>

      <BatchForm
        batch={batchWithItems}
        suppliers={suppliersResult.data || []}
        products={productsResult.data || []}
        currentExchangeRate={currentRate}
      />
    </div>
  )
}
