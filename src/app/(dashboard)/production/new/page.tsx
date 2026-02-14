import { createClient } from '@/lib/supabase/server'
import { ProductionForm } from '../_components/production-form'

export default async function NewProductionPage() {
  const supabase = await createClient()

  const [wigMakersResult, productsResult] = await Promise.all([
    supabase.from('wig_makers').select('*').eq('is_active', true).order('name'),
    supabase.from('products').select('*').eq('product_type', 'finished_product').eq('is_active', true).order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Production Order</h2>
        <p className="text-muted-foreground">
          Create a new wig production order
        </p>
      </div>

      <ProductionForm
        wigMakers={wigMakersResult.data || []}
        products={productsResult.data || []}
      />
    </div>
  )
}
