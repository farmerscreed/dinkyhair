'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Production, WigMaker, Product, ProductionStatus } from '@/lib/supabase/types'

interface ProductionFormProps {
  production?: Production
  wigMakers: WigMaker[]
  products: Product[]
}

export function ProductionForm({ production, wigMakers, products }: ProductionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!production

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    wig_maker_id: production?.wig_maker_id || '',
    product_id: production?.product_id || '',
    status: production?.status || 'pending' as ProductionStatus,
    start_date: production?.start_date || '',
    expected_completion: production?.expected_completion || '',
    actual_completion: production?.actual_completion || '',
    labor_cost: production?.labor_cost?.toString() || '',
    notes: production?.notes || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      wig_maker_id: formData.wig_maker_id || null,
      product_id: formData.product_id || null,
      status: formData.status,
      start_date: formData.start_date || null,
      expected_completion: formData.expected_completion || null,
      actual_completion: formData.actual_completion || null,
      labor_cost: formData.labor_cost ? parseFloat(formData.labor_cost) : null,
      notes: formData.notes || null,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('productions')
          .update(submitData)
          .eq('id', production.id)

        if (error) throw error

        // If completed, add to product stock
        if (submitData.status === 'completed' && production.status !== 'completed' && submitData.product_id) {
          const product = products.find(p => p.id === submitData.product_id)
          if (product) {
            await supabase
              .from('products')
              .update({ quantity_in_stock: product.quantity_in_stock + 1 })
              .eq('id', submitData.product_id)
          }
        }

        toast.success('Production order updated successfully')
      } else {
        const { error } = await supabase
          .from('productions')
          .insert(submitData)

        if (error) throw error
        toast.success('Production order created successfully')
      }

      router.push('/production')
      router.refresh()
    } catch (error) {
      console.error('Error saving production:', error)
      toast.error('Failed to save production order')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!production || !confirm('Are you sure you want to delete this production order?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('productions')
        .delete()
        .eq('id', production.id)

      if (error) throw error
      toast.success('Production order deleted successfully')
      router.push('/production')
      router.refresh()
    } catch (error) {
      console.error('Error deleting production:', error)
      toast.error('Failed to delete production order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product (Wig Type)</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Wig Maker</Label>
                <Select
                  value={formData.wig_maker_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wig_maker_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign wig maker..." />
                  </SelectTrigger>
                  <SelectContent>
                    {wigMakers.map((maker) => (
                      <SelectItem key={maker.id} value={maker.id}>
                        {maker.name} {maker.specialization ? `(${maker.specialization})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProductionStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="labor_cost">Labor Cost (NGN)</Label>
                <Input
                  id="labor_cost"
                  name="labor_cost"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.labor_cost}
                  onChange={handleChange}
                  placeholder="Enter labor cost"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_completion">Expected Completion</Label>
              <Input
                id="expected_completion"
                name="expected_completion"
                type="date"
                value={formData.expected_completion}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual_completion">Actual Completion</Label>
              <Input
                id="actual_completion"
                name="actual_completion"
                type="date"
                value={formData.actual_completion}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Production notes, special instructions..."
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardFooter className="flex justify-between pt-6">
          <div>
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
