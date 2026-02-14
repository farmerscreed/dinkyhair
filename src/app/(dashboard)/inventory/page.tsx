import Link from 'next/link'
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
import { Plus, Pencil, Package, AlertTriangle, Tags } from 'lucide-react'
import type { Product, Category } from '@/lib/supabase/types'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .order('name')

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Manage your products and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory/categories">
              <Tags className="mr-2 h-4 w-4" />
              Categories
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} at or below reorder level
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="raw_material">Raw Materials</TabsTrigger>
          <TabsTrigger value="finished_product">Finished Products</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ProductTable products={products || []} formatCurrency={formatCurrency} />
        </TabsContent>

        <TabsContent value="raw_material" className="mt-4">
          <ProductTable
            products={(products || []).filter((p: Product) => p.product_type === 'raw_material')}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="finished_product" className="mt-4">
          <ProductTable
            products={(products || []).filter((p: Product) => p.product_type === 'finished_product')}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductTable({
  products,
  formatCurrency,
}: {
  products: Product[]
  formatCurrency: (amount: number | null) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products
        </CardTitle>
        <CardDescription>
          {products.length} product{products.length !== 1 ? 's' : ''} in inventory
        </CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Button asChild>
              <Link href="/inventory/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: Product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku || '-'}
                  </TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.product_type === 'raw_material' ? 'Raw Material' : 'Finished'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.quantity_in_stock <= product.reorder_level
                          ? 'text-orange-600 font-medium'
                          : ''
                      }
                    >
                      {product.quantity_in_stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.selling_price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/inventory/${product.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
