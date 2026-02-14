import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '../_components/product-form'

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Product</h2>
        <p className="text-muted-foreground">
          Add a new product to your inventory
        </p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}
