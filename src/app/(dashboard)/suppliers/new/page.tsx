import { SupplierForm } from '../_components/supplier-form'

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Supplier</h2>
        <p className="text-muted-foreground">
          Add a new supplier to your vendor list
        </p>
      </div>

      <SupplierForm />
    </div>
  )
}
