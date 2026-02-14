'use client'

import { useState, useEffect } from 'react'
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
import { format } from 'date-fns'
import type { Batch, Supplier } from '@/lib/supabase/types'

interface BatchFormProps {
  batch?: Batch
  suppliers: Supplier[]
  currentExchangeRate: number | null
}

export function BatchForm({ batch, suppliers, currentExchangeRate }: BatchFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!batch

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: batch?.supplier_id || '',
    purchase_date: batch?.purchase_date || format(new Date(), 'yyyy-MM-dd'),
    total_cost_usd: batch?.total_cost_usd?.toString() || '',
    exchange_rate: batch?.exchange_rate?.toString() || currentExchangeRate?.toString() || '',
    notes: batch?.notes || '',
  })

  const [totalCostNgn, setTotalCostNgn] = useState<number | null>(batch?.total_cost_ngn || null)

  // Calculate NGN when USD or rate changes
  useEffect(() => {
    const usd = parseFloat(formData.total_cost_usd)
    const rate = parseFloat(formData.exchange_rate)
    if (usd && rate) {
      setTotalCostNgn(usd * rate)
    } else {
      setTotalCostNgn(null)
    }
  }, [formData.total_cost_usd, formData.exchange_rate])

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
      supplier_id: formData.supplier_id || null,
      purchase_date: formData.purchase_date,
      total_cost_usd: formData.total_cost_usd ? parseFloat(formData.total_cost_usd) : null,
      exchange_rate: formData.exchange_rate ? parseFloat(formData.exchange_rate) : null,
      total_cost_ngn: totalCostNgn,
      notes: formData.notes || null,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('batches')
          .update(submitData)
          .eq('id', batch.id)

        if (error) throw error
        toast.success('Batch updated successfully')
      } else {
        const { error } = await supabase
          .from('batches')
          .insert(submitData)

        if (error) throw error
        toast.success('Batch created successfully')
      }

      router.push('/inventory/batches')
      router.refresh()
    } catch (error) {
      console.error('Error saving batch:', error)
      toast.error('Failed to save batch')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!batch || !confirm('Are you sure you want to delete this batch?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batch.id)

      if (error) throw error
      toast.success('Batch deleted successfully')
      router.push('/inventory/batches')
      router.refresh()
    } catch (error) {
      console.error('Error deleting batch:', error)
      toast.error('Failed to delete batch')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total_cost_usd">Total Cost (USD)</Label>
              <Input
                id="total_cost_usd"
                name="total_cost_usd"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_cost_usd}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exchange_rate">Exchange Rate (NGN per USD)</Label>
              <Input
                id="exchange_rate"
                name="exchange_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.exchange_rate}
                onChange={handleChange}
                placeholder={currentExchangeRate?.toString() || '0.00'}
              />
              {currentExchangeRate && (
                <p className="text-xs text-muted-foreground">
                  Current rate: ₦{currentExchangeRate.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Total Cost (NGN)</Label>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-lg font-semibold">
                {formatCurrency(totalCostNgn)}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-calculated from USD × Rate
              </p>
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
              placeholder="Purchase details, hair types, quantities..."
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
              {loading ? 'Saving...' : isEditing ? 'Update Batch' : 'Create Batch'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
