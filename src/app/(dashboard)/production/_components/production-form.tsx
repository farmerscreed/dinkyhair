'use client'

import { useState, useMemo } from 'react'
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
import type { Production, ProductionMaterial, WigMaker, Product, ProductionStatus, ProfitMargins } from '@/lib/supabase/types'
import { MaterialSelector, type SelectedMaterial } from './material-selector'

interface ProductionFormProps {
  production?: Production & { materials?: (ProductionMaterial & { product: Product })[] }
  wigMakers: WigMaker[]
  products: Product[]
  rawMaterials: Product[]
  profitMargins: ProfitMargins
}

export function ProductionForm({ production, wigMakers, products, rawMaterials, profitMargins }: ProductionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!production
  const isCompleted = production?.status === 'completed'
  const isCancelled = production?.status === 'cancelled'

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

  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>(() => {
    if (production?.materials && production.materials.length > 0) {
      const materials: SelectedMaterial[] = []
      for (const m of production.materials) {
        if (m.product) {
          materials.push({ product: m.product, quantity: m.quantity, unit_cost: m.unit_cost })
        }
      }
      return materials
    }
    return []
  })

  // Cost calculations
  const totalMaterialCost = useMemo(() =>
    selectedMaterials.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0),
    [selectedMaterials]
  )

  const laborCost = parseFloat(formData.labor_cost) || 0
  const totalProductionCost = totalMaterialCost + laborCost

  // Profit margin for selected product
  const selectedProduct = products.find(p => p.id === formData.product_id)
  const marginPercent = useMemo(() => {
    if (!selectedProduct?.category_id) return profitMargins.default
    return profitMargins[selectedProduct.category_id] ?? profitMargins.default
  }, [selectedProduct, profitMargins])

  const recommendedPrice = totalProductionCost > 0
    ? totalProductionCost * (1 + marginPercent / 100)
    : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate stock
    if (!isEditing) {
      for (const m of selectedMaterials) {
        if (m.quantity > m.product.quantity_in_stock) {
          toast.error(`Not enough stock for ${m.product.name} (need ${m.quantity}, have ${m.product.quantity_in_stock})`)
          return
        }
      }
    }

    setLoading(true)

    try {
      const productionData = {
        wig_maker_id: formData.wig_maker_id || null,
        product_id: formData.product_id || null,
        status: formData.status,
        start_date: formData.start_date || null,
        expected_completion: formData.expected_completion || null,
        actual_completion: formData.actual_completion || null,
        labor_cost: laborCost || null,
        total_material_cost: totalMaterialCost,
        total_production_cost: totalProductionCost,
        recommended_selling_price: recommendedPrice || null,
        notes: formData.notes || null,
      }

      let productionId: string

      if (isEditing) {
        const { error } = await supabase
          .from('productions')
          .update(productionData)
          .eq('id', production.id)
        if (error) throw error
        productionId = production.id

        // Handle status transitions
        const oldStatus = production.status
        const newStatus = formData.status

        // If completed: add 1 to finished product stock
        if (newStatus === 'completed' && oldStatus !== 'completed' && formData.product_id) {
          const product = products.find(p => p.id === formData.product_id)
          if (product) {
            await supabase
              .from('products')
              .update({
                quantity_in_stock: product.quantity_in_stock + 1,
                selling_price: recommendedPrice || product.selling_price,
              })
              .eq('id', formData.product_id)
          }
        }

        // If cancelled: return materials to inventory
        if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
          for (const m of selectedMaterials) {
            await supabase
              .from('products')
              .update({ quantity_in_stock: m.product.quantity_in_stock + m.quantity })
              .eq('id', m.product.id)
          }
        }

        toast.success('Production order updated')
      } else {
        const { data: newProduction, error } = await supabase
          .from('productions')
          .insert(productionData)
          .select()
          .single()
        if (error) throw error
        productionId = newProduction.id

        // Insert production materials
        if (selectedMaterials.length > 0) {
          const materialsToInsert = selectedMaterials.map(m => ({
            production_id: productionId,
            product_id: m.product.id,
            quantity: m.quantity,
            unit_cost: m.unit_cost,
          }))

          const { error: matError } = await supabase
            .from('production_materials')
            .insert(materialsToInsert)
          if (matError) throw matError
        }

        // Deduct materials from inventory
        for (const m of selectedMaterials) {
          await supabase
            .from('products')
            .update({ quantity_in_stock: m.product.quantity_in_stock - m.quantity })
            .eq('id', m.product.id)
        }

        toast.success('Production order created')
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
      toast.success('Production order deleted')
      router.push('/production')
      router.refresh()
    } catch (error) {
      console.error('Error deleting production:', error)
      toast.error('Failed to delete production order')
    } finally {
      setLoading(false)
    }
  }

  const materialsReadOnly = isEditing

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        {/* Order Details */}
        <Card>
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
                  disabled={isCompleted || isCancelled}
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
                  disabled={isCompleted || isCancelled}
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
                  disabled={isCompleted || isCancelled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Selection */}
        <MaterialSelector
          rawMaterials={rawMaterials}
          selectedMaterials={selectedMaterials}
          onMaterialsChange={setSelectedMaterials}
          readOnly={materialsReadOnly}
        />

        {/* Cost Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Material Cost</p>
                <p className="text-xl font-bold">{formatCurrency(totalMaterialCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Labor Cost</p>
                <p className="text-xl font-bold">{formatCurrency(laborCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Production Cost</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalProductionCost)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Profit Margin</p>
                <p className="text-xl font-bold">{marginPercent}%</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Recommended Selling Price</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(recommendedPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="grid gap-6 md:grid-cols-2">
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

        {/* Actions */}
        <Card>
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
      </div>
    </form>
  )
}
