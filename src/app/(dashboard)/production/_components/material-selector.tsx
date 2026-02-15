'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, Minus, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/supabase/types'

export interface SelectedMaterial {
  product: Product
  quantity: number
  unit_cost: number
}

interface MaterialSelectorProps {
  rawMaterials: Product[]
  selectedMaterials: SelectedMaterial[]
  onMaterialsChange: (materials: SelectedMaterial[]) => void
  readOnly?: boolean
}

export function MaterialSelector({ rawMaterials, selectedMaterials, onMaterialsChange, readOnly }: MaterialSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMaterials = useMemo(() => {
    if (!searchTerm) return rawMaterials
    const lower = searchTerm.toLowerCase()
    return rawMaterials.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.sku?.toLowerCase().includes(lower)
    )
  }, [rawMaterials, searchTerm])

  const addMaterial = (product: Product) => {
    const existing = selectedMaterials.find(m => m.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.quantity_in_stock) {
        toast.error(`Not enough stock for ${product.name}`)
        return
      }
      onMaterialsChange(selectedMaterials.map(m =>
        m.product.id === product.id
          ? { ...m, quantity: m.quantity + 1 }
          : m
      ))
    } else {
      if (product.quantity_in_stock <= 0) {
        toast.error(`${product.name} is out of stock`)
        return
      }
      onMaterialsChange([...selectedMaterials, {
        product,
        quantity: 1,
        unit_cost: product.cost_price_ngn || 0,
      }])
    }
  }

  const updateQuantity = (productId: string, delta: number) => {
    onMaterialsChange(selectedMaterials.map(m => {
      if (m.product.id !== productId) return m
      const newQty = m.quantity + delta
      if (newQty < 1) return m
      if (newQty > m.product.quantity_in_stock) {
        toast.error(`Not enough stock for ${m.product.name}`)
        return m
      }
      return { ...m, quantity: newQty }
    }))
  }

  const removeMaterial = (productId: string) => {
    onMaterialsChange(selectedMaterials.filter(m => m.product.id !== productId))
  }

  const totalCost = selectedMaterials.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', currency: 'NGN', minimumFractionDigits: 0,
    }).format(amount)
  }

  if (readOnly) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Materials Used</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedMaterials.length === 0 ? (
            <p className="text-muted-foreground text-sm">No materials recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMaterials.map(m => (
                  <TableRow key={m.product.id}>
                    <TableCell className="font-medium">{m.product.name}</TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.unit_cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(m.quantity * m.unit_cost)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatCurrency(totalCost)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left: Material Grid */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search raw materials..."
            className="pl-10 h-10 bg-white/5 border-white/10 focus:border-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto max-h-[400px] pr-1">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMaterials.map((product) => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addMaterial(product)}
                disabled={product.quantity_in_stock <= 0}
                className={cn(
                  "text-left group relative flex flex-col p-3 rounded-xl border transition-all duration-200",
                  product.quantity_in_stock <= 0
                    ? "border-white/5 bg-white/2 opacity-50 cursor-not-allowed"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50"
                )}
              >
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={product.quantity_in_stock <= product.reorder_level ? "destructive" : "secondary"}
                    className="text-xs px-1.5 py-0.5 h-auto"
                  >
                    {product.quantity_in_stock}
                  </Badge>
                </div>

                <div className="mb-2 p-2 rounded-lg bg-primary/10 text-primary self-center">
                  <Package className="h-5 w-5" />
                </div>

                <h4 className="font-medium text-xs line-clamp-2 mb-1">{product.name}</h4>
                {product.sku && (
                  <p className="text-[10px] font-mono text-muted-foreground">{product.sku}</p>
                )}
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  {formatCurrency(product.cost_price_ngn || 0)}
                </p>
              </motion.button>
            ))}

            {filteredMaterials.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-6 text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No materials found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Selected Materials */}
      <Card className="w-full lg:w-[380px] flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Selected Materials
            <Badge variant="outline" className="text-xs">
              {selectedMaterials.reduce((s, m) => s + m.quantity, 0)} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0 max-h-[300px]">
          {selectedMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-10" />
              <p className="text-sm text-center">No materials selected.<br />Click materials to add.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {selectedMaterials.map((m) => (
                  <motion.div
                    key={m.product.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-between p-3 hover:bg-white/5"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <h4 className="font-medium text-sm truncate">{m.product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(m.unit_cost)} x {m.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-md border border-white/10 bg-black/20">
                        <button
                          type="button"
                          onClick={() => updateQuantity(m.product.id, -1)}
                          className="p-1 hover:bg-white/10 hover:text-red-400 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{m.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(m.product.id, 1)}
                          className="p-1 hover:bg-white/10 hover:text-green-400 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-semibold text-sm min-w-[55px] text-right">
                        {formatCurrency(m.quantity * m.unit_cost)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeMaterial(m.product.id)}
                        className="p-1 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        {selectedMaterials.length > 0 && (
          <div className="p-3 border-t border-white/10 bg-black/20">
            <div className="flex justify-between font-bold">
              <span>Total Material Cost</span>
              <span className="text-primary">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
