import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../_components/batch-form'

interface EditBatchPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBatchPage({ params }: EditBatchPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [batchResult, suppliersResult, exchangeRateResult] = await Promise.all([
    supabase.from('batches').select('*').eq('id', id).single(),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('exchange_rates').select('rate').order('effective_date', { ascending: false }).limit(1),
  ])

  if (batchResult.error || !batchResult.data) {
    notFound()
  }

  const currentRate = exchangeRateResult.data?.[0]?.rate || null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory/batches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Batch</h2>
          <p className="text-muted-foreground">
            Update batch {batchResult.data.batch_number}
          </p>
        </div>
      </div>

      <BatchForm
        batch={batchResult.data}
        suppliers={suppliersResult.data || []}
        currentExchangeRate={currentRate}
      />
    </div>
  )
}
