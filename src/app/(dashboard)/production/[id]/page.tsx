import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductionForm } from '../_components/production-form'
import type { ProfitMargins } from '@/lib/supabase/types'

interface EditProductionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductionPage({ params }: EditProductionPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [productionResult, materialsResult, wigMakersResult, productsResult, rawMaterialsResult, settingsResult] = await Promise.all([
    supabase.from('productions').select('*').eq('id', id).single(),
    supabase.from('production_materials').select('*, product:products(*)').eq('production_id', id),
    supabase.from('wig_makers').select('*').eq('is_active', true).order('name'),
    supabase.from('products').select('*').eq('product_type', 'finished_product').eq('is_active', true).order('name'),
    supabase.from('products').select('*').eq('product_type', 'raw_material').eq('is_active', true).order('name'),
    supabase.from('settings').select('*').eq('key', 'profit_margins').single(),
  ])

  if (productionResult.error || !productionResult.data) {
    notFound()
  }

  const profitMargins: ProfitMargins = (settingsResult.data?.value as ProfitMargins) || { default: 50 }

  const productionWithMaterials = {
    ...productionResult.data,
    materials: materialsResult.data || [],
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
        production={productionWithMaterials}
        wigMakers={wigMakersResult.data || []}
        products={productsResult.data || []}
        rawMaterials={rawMaterialsResult.data || []}
        profitMargins={profitMargins}
      />
    </div>
  )
}
