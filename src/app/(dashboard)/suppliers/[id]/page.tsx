import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SupplierForm } from '../_components/supplier-form'

interface EditSupplierPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !supplier) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Supplier</h2>
        <p className="text-muted-foreground">
          Update supplier information
        </p>
      </div>

      <SupplierForm supplier={supplier} />
    </div>
  )
}
