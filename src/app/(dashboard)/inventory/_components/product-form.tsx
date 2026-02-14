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
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Product, Category, ProductType } from '@/lib/supabase/types'

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!product

  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url || null)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    product_type: product?.product_type || 'finished_product' as ProductType,
    category_id: product?.category_id || '',
    cost_price_usd: product?.cost_price_usd?.toString() || '',
    cost_price_ngn: product?.cost_price_ngn?.toString() || '',
    selling_price: product?.selling_price?.toString() || '',
    quantity_in_stock: product?.quantity_in_stock?.toString() || '0',
    reorder_level: product?.reorder_level?.toString() || '5',
    is_active: product?.is_active ?? true,
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
      name: formData.name,
      sku: formData.sku || null,
      description: formData.description || null,
      product_type: formData.product_type,
      category_id: formData.category_id || null,
      cost_price_usd: formData.cost_price_usd ? parseFloat(formData.cost_price_usd) : null,
      cost_price_ngn: formData.cost_price_ngn ? parseFloat(formData.cost_price_ngn) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      quantity_in_stock: parseInt(formData.quantity_in_stock) || 0,
      reorder_level: parseInt(formData.reorder_level) || 5,
      is_active: formData.is_active,
      image_url: imageUrl,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(submitData)
          .eq('id', product.id)

        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(submitData)

        if (error) throw error
        toast.success('Product created successfully')
      }

      router.push('/inventory')
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!product || !confirm('Are you sure you want to delete this product?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error
      toast.success('Product deleted successfully')
      router.push('/inventory')
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  // Filter categories by product type
  const filteredCategories = categories.filter(
    (cat) => cat.product_type === formData.product_type
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="space-y-2">
                <Label>Product Image</Label>
                <ImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Enter SKU code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product_type">Product Type *</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value: ProductType) => {
                      setFormData(prev => ({
                        ...prev,
                        product_type: value,
                        category_id: '', // Reset category when type changes
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="finished_product">Finished Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      category_id: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length === 0 ? (
                        <SelectItem value="" disabled>
                          No categories for this type
                        </SelectItem>
                      ) : (
                        filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price_usd">Cost Price (USD)</Label>
              <Input
                id="cost_price_usd"
                name="cost_price_usd"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price_usd}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price_ngn">Cost Price (NGN)</Label>
              <Input
                id="cost_price_ngn"
                name="cost_price_ngn"
                type="number"
                min="0"
                step="1"
                value={formData.cost_price_ngn}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price (NGN) *</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                min="0"
                step="1"
                value={formData.selling_price}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
              <Input
                id="quantity_in_stock"
                name="quantity_in_stock"
                type="number"
                min="0"
                value={formData.quantity_in_stock}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min="0"
                value={formData.reorder_level}
                onChange={handleChange}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls to or below this level
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  is_active: value === 'active'
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
