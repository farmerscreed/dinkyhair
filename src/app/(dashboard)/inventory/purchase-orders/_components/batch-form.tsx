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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SKUGenerator } from '@/components/inventory/sku-generator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Trash2, Wand2, PackagePlus } from 'lucide-react'
import type { Batch, BatchItem, Supplier, Product, BatchStatus } from '@/lib/supabase/types'
import type { HairAttributes } from '@/lib/sku-config'

interface LineItem {
  product_id: string
  product_name: string
  quantity: number
  unit_cost_usd: number
}

interface BatchFormProps {
  batch?: Batch & { items?: (BatchItem & { product: { id: string; name: string } })[] }
  suppliers: Supplier[]
  products: Product[]
  currentExchangeRate: number | null
}

export function BatchForm({ batch, suppliers, products, currentExchangeRate }: BatchFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!batch
  const isReceived = batch?.status === 'received'

  const [loading, setLoading] = useState(false)
  const [showSKUGenerator, setShowSKUGenerator] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>(products)

  const [formData, setFormData] = useState({
    supplier_id: batch?.supplier_id || '',
    purchase_date: batch?.purchase_date || format(new Date(), 'yyyy-MM-dd'),
    exchange_rate: batch?.exchange_rate?.toString() || currentExchangeRate?.toString() || '',
    status: (batch?.status || 'draft') as BatchStatus,
    notes: batch?.notes || '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (batch?.items && batch.items.length > 0) {
      return batch.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Unknown',
        quantity: item.quantity,
        unit_cost_usd: item.unit_cost_usd,
      }))
    }
    return []
  })

  const totalCostUsd = useMemo(() =>
    lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost_usd), 0),
    [lineItems]
  )

  const exchangeRate = parseFloat(formData.exchange_rate) || 0
  const totalCostNgn = totalCostUsd * exchangeRate

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const addLineItem = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId)
    if (!product) return

    if (lineItems.find(li => li.product_id === productId)) {
      toast.error('Product already added. Update the quantity instead.')
      return
    }

    setLineItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_cost_usd: product.cost_price_usd || 0,
    }])
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: number | string) => {
    setLineItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSKUComplete = async (data: { sku: string; name: string; attributes: HairAttributes }) => {
    setShowSKUGenerator(false)

    try {
      const productType = data.attributes.formCode === 'WIG' ? 'finished_product' : 'raw_material'
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: data.name,
          sku: data.sku,
          product_type: productType,
          hair_origin: data.attributes.originCode,
          hair_texture: data.attributes.textureCode,
          hair_length: data.attributes.length,
          hair_color: data.attributes.colorCode,
          hair_form: data.attributes.formCode,
          hair_form_size: data.attributes.formSize || null,
          hair_wig_name: data.attributes.wigName || null,
          quantity_in_stock: 0,
          reorder_level: 5,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setAvailableProducts(prev => [...prev, newProduct])
      setLineItems(prev => [...prev, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        quantity: 1,
        unit_cost_usd: 0,
      }])

      toast.success(`Product "${data.name}" created and added`)
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (lineItems.length === 0) {
      toast.error('Add at least one line item')
      return
    }

    for (const item of lineItems) {
      if (item.quantity <= 0) {
        toast.error(`Quantity must be positive for ${item.product_name}`)
        return
      }
    }

    setLoading(true)

    try {
      const batchData = {
        supplier_id: formData.supplier_id || null,
        purchase_date: formData.purchase_date,
        total_cost_usd: totalCostUsd,
        exchange_rate: exchangeRate || null,
        total_cost_ngn: totalCostNgn || null,
        status: formData.status,
        notes: formData.notes || null,
      }

      let batchId: string

      if (isEditing) {
        const { error } = await supabase
          .from('batches')
          .update(batchData)
          .eq('id', batch.id)
        if (error) throw error
        batchId = batch.id

        await supabase.from('batch_items').delete().eq('batch_id', batchId)
      } else {
        const { data: newBatch, error } = await supabase
          .from('batches')
          .insert(batchData)
          .select()
          .single()
        if (error) throw error
        batchId = newBatch.id
      }

      const itemsToInsert = lineItems.map(item => ({
        batch_id: batchId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost_usd: item.unit_cost_usd,
      }))

      const { error: itemsError } = await supabase
        .from('batch_items')
        .insert(itemsToInsert)
      if (itemsError) throw itemsError

      // If status changed to "received", update inventory
      const wasReceived = batch?.status === 'received'
      const nowReceived = formData.status === 'received'

      if (nowReceived && !wasReceived) {
        for (const item of lineItems) {
          const product = availableProducts.find(p => p.id === item.product_id)
          if (product) {
            const itemCostNgn = item.unit_cost_usd * exchangeRate

            await supabase
              .from('products')
              .update({
                quantity_in_stock: product.quantity_in_stock + item.quantity,
                cost_price_usd: item.unit_cost_usd,
                cost_price_ngn: itemCostNgn || product.cost_price_ngn,
              })
              .eq('id', item.product_id)
          }
        }
      }

      toast.success(isEditing ? 'Purchase order updated' : 'Purchase order created')
      router.push('/inventory/purchase-orders')
      router.refresh()
    } catch (error) {
      console.error('Error saving purchase order:', error)
      toast.error('Failed to save purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!batch) return
    if (isReceived) {
      toast.error('Cannot delete a received purchase order')
      return
    }
    if (!confirm('Are you sure you want to delete this purchase order?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batch.id)
      if (error) throw error
      toast.success('Purchase order deleted')
      router.push('/inventory/purchase-orders')
      router.refresh()
    } catch (error) {
      console.error('Error deleting purchase order:', error)
      toast.error('Failed to delete purchase order')
    } finally {
      setLoading(false)
    }
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatNGN = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Header & Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Purchase Order Details</CardTitle>
                {isEditing && (
                  <Badge variant={isReceived ? 'default' : 'secondary'}>
                    {isReceived ? 'Received' : 'Draft'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    disabled={isReceived}
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
                    disabled={isReceived}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exchange_rate">Exchange Rate (NGN/USD)</Label>
                  <Input
                    id="exchange_rate"
                    name="exchange_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.exchange_rate}
                    onChange={handleChange}
                    placeholder={currentExchangeRate?.toString() || '0.00'}
                    disabled={isReceived}
                  />
                  {currentExchangeRate && (
                    <p className="text-xs text-muted-foreground">
                      Current rate: {currentExchangeRate.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: BatchStatus) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isReceived}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.status === 'received' && !isReceived && (
                    <p className="text-xs text-amber-400">
                      Marking as received will add items to inventory
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Line Items</CardTitle>
                {!isReceived && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSKUGenerator(true)}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Create New Product
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isReceived && (
                <div className="flex gap-2">
                  <Select onValueChange={addLineItem}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add a product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts
                        .filter(p => !lineItems.some(li => li.product_id === p.id))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.sku ? `(${product.sku})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {lineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[120px]">Quantity</TableHead>
                      <TableHead className="w-[160px]">Unit Cost (USD)</TableHead>
                      <TableHead className="text-right w-[140px]">Line Total (USD)</TableHead>
                      {!isReceived && <TableHead className="w-[60px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="h-8"
                            disabled={isReceived}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost_usd}
                            onChange={(e) => updateLineItem(index, 'unit_cost_usd', parseFloat(e.target.value) || 0)}
                            className="h-8"
                            disabled={isReceived}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatUSD(item.quantity * item.unit_cost_usd)}
                        </TableCell>
                        {!isReceived && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
                  <PackagePlus className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
                  <p className="text-muted-foreground text-sm">No items added yet</p>
                  <p className="text-muted-foreground text-xs mt-1">Select a product above or create a new one</p>
                </div>
              )}

              {lineItems.length > 0 && (
                <div className="flex justify-end">
                  <div className="w-[340px] space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span>{lineItems.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Qty</span>
                      <span>{lineItems.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total (USD)</span>
                      <span>{formatUSD(totalCostUsd)}</span>
                    </div>
                    {exchangeRate > 0 && (
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Total (NGN)</span>
                        <span>{formatNGN(totalCostNgn)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
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
                placeholder="Purchase details, notes..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardFooter className="flex justify-between pt-6">
              <div>
                {isEditing && !isReceived && (
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
                {!isReceived && (
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>

      <Dialog open={showSKUGenerator} onOpenChange={setShowSKUGenerator}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-violet-400" />
              Create New Product (SKU Generator)
            </DialogTitle>
          </DialogHeader>
          <SKUGenerator
            onComplete={handleSKUComplete}
            onCancel={() => setShowSKUGenerator(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
