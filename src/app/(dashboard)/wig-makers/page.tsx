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
import { Plus, Pencil, Phone, Mail } from 'lucide-react'
import type { WigMaker } from '@/lib/supabase/types'

export default async function WigMakersPage() {
  const supabase = await createClient()

  const { data: wigMakers, error } = await supabase
    .from('wig_makers')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching wig makers:', error)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Wig Makers</h2>
          <p className="text-muted-foreground">
            Manage your wig makers and artisans
          </p>
        </div>
        <Button asChild>
          <Link href="/wig-makers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Wig Maker
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Wig Makers</CardTitle>
          <CardDescription>
            {wigMakers?.length || 0} wig maker{wigMakers?.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!wigMakers || wigMakers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No wig makers added yet</p>
              <Button asChild>
                <Link href="/wig-makers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Wig Maker
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Rate/Wig</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wigMakers.map((maker: WigMaker) => (
                  <TableRow key={maker.id}>
                    <TableCell className="font-medium">{maker.name}</TableCell>
                    <TableCell>{maker.specialization || '-'}</TableCell>
                    <TableCell>{formatCurrency(maker.rate_per_wig)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {maker.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {maker.phone}
                          </span>
                        )}
                        {maker.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {maker.email}
                          </span>
                        )}
                        {!maker.phone && !maker.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={maker.is_active ? 'default' : 'secondary'}>
                        {maker.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/wig-makers/${maker.id}`}>
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
    </div>
  )
}
