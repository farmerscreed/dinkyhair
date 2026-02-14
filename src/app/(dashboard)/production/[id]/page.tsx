import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductionForm } from '../_components/production-form'

interface EditProductionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductionPage({ params }: EditProductionPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [productionResult, wigMakersResult, productsResult] = await Promise.all([
    supabase.from('productions').select('*').eq('id', id).single(),
    supabase.from('wig_makers').select('*').eq('is_active', true).order('name'),
    supabase.from('products').select('*').eq('product_type', 'finished_product').eq('is_active', true).order('name'),
  ])

  if (productionResult.error || !productionResult.data) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Edit Production Order
        </h2>
        <p className="text-muted-foreground">
          Update production order {productionResult.data.production_number}
        </p>
      </div>

      <ProductionForm
        production={productionResult.data}
        wigMakers={wigMakersResult.data || []}
        products={productsResult.data || []}
      />
    </div>
  )
}
