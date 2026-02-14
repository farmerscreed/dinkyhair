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
import { Plus, Eye, Factory } from 'lucide-react'
import { format } from 'date-fns'
import type { Production, ProductionStatus } from '@/lib/supabase/types'

export default async function ProductionPage() {
  const supabase = await createClient()

  const { data: productions, error } = await supabase
    .from('productions')
    .select('*, wig_maker:wig_makers(name), product:products(name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching productions:', error)
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: ProductionStatus) => {
    const variants: Record<ProductionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    }
    const labels: Record<ProductionStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const filterByStatus = (status: ProductionStatus | 'all') => {
    if (status === 'all') return productions || []
    return (productions || []).filter((p: Production) => p.status === status)
  }

  const pendingCount = filterByStatus('pending').length
  const inProgressCount = filterByStatus('in_progress').length
  const completedCount = filterByStatus('completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Production</h2>
          <p className="text-muted-foreground">
            Track wig production orders and assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/production/new">
            <Plus className="mr-2 h-4 w-4" />
            New Production Order
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {(['all', 'pending', 'in_progress', 'completed'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <ProductionTable
              productions={filterByStatus(tab)}
              formatCurrency={formatCurrency}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ProductionTable({
  productions,
  formatCurrency,
  getStatusBadge,
}: {
  productions: (Production & { wig_maker: { name: string } | null; product: { name: string } | null })[]
  formatCurrency: (amount: number | null) => string
  getStatusBadge: (status: ProductionStatus) => React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Production Orders
        </CardTitle>
        <CardDescription>
          {productions.length} order{productions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {productions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No production orders found</p>
            <Button asChild>
              <Link href="/production/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Production Order
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Wig Maker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead className="text-right">Labor Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((production) => (
                <TableRow key={production.id}>
                  <TableCell className="font-medium font-mono">
                    {production.production_number}
                  </TableCell>
                  <TableCell>{production.product?.name || '-'}</TableCell>
                  <TableCell>{production.wig_maker?.name || 'Unassigned'}</TableCell>
                  <TableCell>{getStatusBadge(production.status)}</TableCell>
                  <TableCell>
                    {production.start_date
                      ? format(new Date(production.start_date), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {production.expected_completion
                      ? format(new Date(production.expected_completion), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(production.labor_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/production/${production.id}`}>
                        <Eye className="h-4 w-4" />
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
