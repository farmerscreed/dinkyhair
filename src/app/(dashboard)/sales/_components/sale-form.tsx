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
import { Plus, Minus, Trash2, ShoppingCart, Search, CreditCard, Banknote, Smartphone, Package, CheckCircle2, User, X } from 'lucide-react'
import type { Product, Customer, PaymentMethod, SalesChannel } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [salesChannel, setSalesChannel] = useState<SalesChannel>('in_store')
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const lower = searchTerm.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.sku?.toLowerCase().includes(lower)
    )
  }, [products, searchTerm])

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

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Product Grid Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-primary/50 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className="text-left group relative flex flex-col items-start p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all duration-200"
              >
                <div className="absolute top-2 right-2">
                  <Badge variant={product.quantity_in_stock <= product.reorder_level ? "destructive" : "secondary"} className="text-xs px-1.5 py-0.5 h-auto">
                    {product.quantity_in_stock}
                  </Badge>
                </div>

                <div className="mb-3 p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors self-center">
                  <Package className="h-6 w-6" />
                </div>

                <div className="w-full">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                    {formatCurrency(product.selling_price || 0)}
                  </p>
                </div>
              </motion.button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Package className="h-10 w-10 mb-2 opacity-20" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart & Checkout Section */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 h-full">
        <Card className="flex flex-col h-full bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="pb-3 border-b border-white/10">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Current Sale
              </span>
              <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5 text-primary">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <ShoppingCart className="h-12 w-12 mb-3 opacity-10" />
                <p className="text-center text-sm">Cart is empty.<br />Select products to start.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.product.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-medium text-sm truncate mb-1">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)} × {item.quantity}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-md border border-white/10 bg-black/20">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, -1)}
                            className="p-1 hover:bg-white/10 hover:text-red-400 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, 1)}
                            className="p-1 hover:bg-white/10 hover:text-green-400 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="font-bold text-sm min-w-[60px] text-right">{formatCurrency(item.total_price)}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t border-white/10 bg-black/20 space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-9 text-xs">
                    <div className="flex items-center truncate">
                      <User className="h-3 w-3 mr-2 opacity-70" />
                      <span className="truncate">{customerId ? customers.find(c => c.id === customerId)?.name : "Walk-in Customer"}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in Customer</SelectItem>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash"><div className="flex items-center"><Banknote className="h-3 w-3 mr-2" />Cash</div></SelectItem>
                    <SelectItem value="transfer"><div className="flex items-center"><Smartphone className="h-3 w-3 mr-2" />Transfer</div></SelectItem>
                    <SelectItem value="pos"><div className="flex items-center"><CreditCard className="h-3 w-3 mr-2" />POS</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between text-muted-foreground text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground shrink-0">Discount</span>
                <Input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="0"
                  className="h-7 w-24 text-right bg-white/5 border-white/10 text-xs p-1"
                />
              </div>

              <div className="flex items-center justify-between font-bold text-lg pt-2 border-t border-white/10">
                <span>Total</span>
                <span className="text-primary tracking-tight">{formatCurrency(total)}</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25 h-12 text-base font-bold tracking-wide"
              disabled={loading || cart.length === 0}
            >
              {loading ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
