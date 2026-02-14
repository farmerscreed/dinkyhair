import { createClient } from '@/lib/supabase/server'
import { SaleForm } from '../_components/sale-form'

export default async function NewSalePage() {
  const supabase = await createClient()

  const [productsResult, customersResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('quantity_in_stock', 0)
      .order('name'),
    supabase.from('customers').select('*').order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Sale</h2>
        <p className="text-muted-foreground">
          Record a new sale transaction
        </p>
      </div>

      <SaleForm
        products={productsResult.data || []}
        customers={customersResult.data || []}
      />
    </div>
  )
}
