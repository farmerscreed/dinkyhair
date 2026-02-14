'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import type { ExchangeRate } from '@/lib/supabase/types'

interface ExchangeRateSettingsProps {
  exchangeRates: ExchangeRate[]
}

export function ExchangeRateSettings({ exchangeRates }: ExchangeRateSettingsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    rate: '',
    effective_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  const currentRate = exchangeRates[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          rate: parseFloat(formData.rate),
          effective_date: formData.effective_date,
          notes: formData.notes || null,
        })

      if (error) throw error

      toast.success('Exchange rate added successfully')
      setShowForm(false)
      setFormData({ rate: '', effective_date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
      router.refresh()
    } catch (error) {
      console.error('Error adding exchange rate:', error)
      toast.error('Failed to add exchange rate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Exchange Rate</CardTitle>
          <CardDescription>
            USD to NGN conversion rate for pricing calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentRate ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                1 USD = ₦{currentRate.rate.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                Effective from {format(new Date(currentRate.effective_date), 'MMMM d, yyyy')}
              </p>
              {currentRate.notes && (
                <p className="text-sm text-muted-foreground">{currentRate.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No exchange rate set</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Rate
          </Button>
        </CardFooter>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Exchange Rate</CardTitle>
            <CardDescription>
              Set a new USD to NGN exchange rate
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate (NGN per USD) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="e.g., 1550.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_date">Effective Date *</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes about this rate"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Rate'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {exchangeRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate History</CardTitle>
            <CardDescription>
              Previous exchange rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Rate (NGN/USD)</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      {format(new Date(rate.effective_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ₦{rate.rate.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rate.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
