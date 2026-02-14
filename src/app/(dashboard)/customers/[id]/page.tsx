import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CustomerForm } from '../_components/customer-form'

interface EditCustomerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Customer</h2>
        <p className="text-muted-foreground">
          Update customer information
        </p>
      </div>

      <CustomerForm customer={customer} />
    </div>
  )
}
