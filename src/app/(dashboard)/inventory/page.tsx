import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Package, AlertTriangle, Tags, Boxes, ImageIcon, Search } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import type { Product, Category } from '@/lib/supabase/types'

interface InventoryPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const { q: searchQuery } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name')

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data: products, error: productsError } = await query

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (productsError) console.error('Error fetching products:', productsError)
  if (categoriesError) console.error('Error fetching categories:', categoriesError)

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const lowStockProducts = products?.filter(
    (p: Product) => p.quantity_in_stock <= p.reorder_level
  ) || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-card/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent neon-text">Inventory</h2>
          <p className="text-muted-foreground mt-1">
            Manage your products and stock levels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" asChild className="border-white/10 hover:bg-white/5">
            <Link href="/inventory/purchase-orders">
              <Boxes className="mr-2 h-4 w-4" />
              Purchase Orders
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-white/10 hover:bg-white/5">
            <Link href="/inventory/categories">
              <Tags className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild variant="neon">
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Suspense fallback={null}>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <SearchInput placeholder="Search products..." className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 text-white w-full" />
          </div>
        </Suspense>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="glass border-l-4 border-l-orange-500/50 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-400/80">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} at or below reorder level
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">All Products</TabsTrigger>
          <TabsTrigger value="raw_material" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary-foreground">Raw Materials</TabsTrigger>
          <TabsTrigger value="finished_product" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent-foreground">Finished Products</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <ProductTable products={products || []} formatCurrency={formatCurrency} searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="raw_material" className="mt-0">
          <ProductTable
            products={(products || []).filter((p: Product) => p.product_type === 'raw_material')}
            formatCurrency={formatCurrency}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="finished_product" className="mt-0">
          <ProductTable
            products={(products || []).filter((p: Product) => p.product_type === 'finished_product')}
            formatCurrency={formatCurrency}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductTable({
  products,
  formatCurrency,
  searchQuery,
}: {
  products: Product[]
  formatCurrency: (amount: number | null) => string
  searchQuery?: string
}) {
  return (
    <Card className="glass border-white/10 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products
        </CardTitle>
        <CardDescription>
          {products.length} product{products.length !== 1 ? 's' : ''}
          {searchQuery ? ` matching "${searchQuery}"` : ' in inventory'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-xl border border-white/5 border-dashed m-4">
            <p className="text-muted-foreground mb-6 text-lg">
              {searchQuery ? 'No products match your search' : 'No products found'}
            </p>
            {!searchQuery && (
              <Button asChild variant="neon">
                <Link href="/inventory/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[60px] text-white/70"></TableHead>
                  <TableHead className="text-white/70">Product</TableHead>
                  <TableHead className="text-white/70">SKU</TableHead>
                  <TableHead className="text-white/70">Category</TableHead>
                  <TableHead className="text-white/70">Type</TableHead>
                  <TableHead className="text-right text-white/70">Stock</TableHead>
                  <TableHead className="text-right text-white/70">Cost</TableHead>
                  <TableHead className="text-right text-white/70">Price</TableHead>
                  <TableHead className="text-right text-white/70">Margin</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-right text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow key={product.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                    <TableCell>
                      {product.image_url ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10 group-hover:border-primary/50 transition-colors">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 transition-colors">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-white group-hover:text-primary transition-colors">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20">
                        {product.product_type === 'raw_material' ? 'Raw Material' : 'Finished'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          product.quantity_in_stock <= product.reorder_level
                            ? 'text-orange-400 font-bold'
                            : 'text-white'
                        }
                      >
                        {product.quantity_in_stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(product.cost_price_ngn)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-white">
                      {formatCurrency(product.selling_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.cost_price_ngn && product.selling_price ? (
                        <span className={((product.selling_price - product.cost_price_ngn) / product.cost_price_ngn * 100) >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {((product.selling_price - product.cost_price_ngn) / product.cost_price_ngn * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'} className={product.is_active ? "bg-primary/20 text-primary-foreground border-primary/20" : "bg-white/10 text-muted-foreground"}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="hover:bg-primary/20 hover:text-primary">
                        <Link href={`/inventory/${product.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
