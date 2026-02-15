import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { BatchForm } from '../_components/batch-form'

export default async function NewPurchaseOrderPage() {
  const supabase = await createClient()

  const [suppliersResult, productsResult, exchangeRateResult] = await Promise.all([
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('exchange_rates').select('rate').order('effective_date', { ascending: false }).limit(1),
  ])

  const currentRate = exchangeRateResult.data?.[0]?.rate || null

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
          <h2 className="text-2xl font-bold tracking-tight">New Purchase Order</h2>
          <p className="text-muted-foreground">
            Record a new purchase from a supplier
          </p>
        </div>
      </div>

      <BatchForm
        suppliers={suppliersResult.data || []}
        products={productsResult.data || []}
        currentExchangeRate={currentRate}
      />
    </div>
  )
}
