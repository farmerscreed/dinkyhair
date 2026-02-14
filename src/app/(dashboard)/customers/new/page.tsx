import { CustomerForm } from '../_components/customer-form'

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Customer</h2>
        <p className="text-muted-foreground">
          Add a new customer to your database
        </p>
      </div>

      <CustomerForm />
    </div>
  )
}
