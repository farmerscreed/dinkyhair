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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import type { Product, Customer, PaymentMethod, SalesChannel } from '@/lib/supabase/types'

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  total_price: number
}

interface SaleFormProps {
  products: Product[]
  customers: Customer[]
}

export function SaleForm({ products, customers }: SaleFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('in_store')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0)
  const discountAmount = parseFloat(discount) || 0
  const total = subtotal - discountAmount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const addToCart = () => {
    if (!selectedProductId) return

    const product = products.find(p => p.id === selectedProductId)
    if (!product) return

    const existingIndex = cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      // Check stock
      if (cart[existingIndex].quantity >= product.quantity_in_stock) {
        toast.error('Not enough stock')
        return
      }

      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      newCart[existingIndex].total_price = newCart[existingIndex].quantity * newCart[existingIndex].unit_price
      setCart(newCart)
    } else {
      const price = product.selling_price || 0
      setCart([...cart, {
        product,
        quantity: 1,
        unit_price: price,
        total_price: price,
      }])
    }

    setSelectedProductId('')
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    const item = newCart[index]
    const newQty = item.quantity + delta

    if (newQty < 1) {
      removeFromCart(index)
      return
    }

    if (newQty > item.product.quantity_in_stock) {
      toast.error('Not enough stock')
      return
    }

    item.quantity = newQty
    item.total_price = item.quantity * item.unit_price
    setCart(newCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (total < 0) {
      toast.error('Total cannot be negative')
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: customerId || null,
          subtotal,
          discount: discountAmount,
          total,
          payment_method: paymentMethod,
          sales_channel: salesChannel,
          staff_id: user.id,
          notes: notes || null,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({
            quantity_in_stock: item.product.quantity_in_stock - item.quantity
          })
          .eq('id', item.product.id)

        if (stockError) {
          console.error('Error updating stock:', stockError)
        }
      }

      // Update customer total purchases if customer selected
      if (customerId) {
        const customer = customers.find(c => c.id === customerId)
        if (customer) {
          await supabase
            .from('customers')
            .update({
              total_purchases: (customer.total_purchases || 0) + total
            })
            .eq('id', customerId)
        }
      }

      toast.success('Sale recorded successfully')
      router.push(`/sales/${sale.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error creating sale:', error)
      toast.error('Failed to record sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Selection & Cart */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.selling_price || 0)} ({product.quantity_in_stock} in stock)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addToCart} disabled={!selectedProductId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items in cart. Add products above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, index) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sale Details & Checkout */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer (Optional)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Walk-in customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sales Channel</Label>
                <Select
                  value={salesChannel}
                  onValueChange={(v) => setSalesChannel(v as SalesChannel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_store">In Store</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount (NGN)</Label>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || cart.length === 0}
              >
                {loading ? 'Processing...' : `Complete Sale - ${formatCurrency(total)}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  )
}
