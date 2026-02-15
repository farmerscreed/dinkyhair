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
import { Percent, Save } from 'lucide-react'
import type { Category, ProfitMargins } from '@/lib/supabase/types'

interface ProfitMarginSettingsProps {
  categories: Category[]
  profitMargins: ProfitMargins
}

export function ProfitMarginSettings({ categories, profitMargins }: ProfitMarginSettingsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [margins, setMargins] = useState<ProfitMargins>({
    ...profitMargins,
    default: profitMargins.default ?? 50,
  })

  const updateMargin = (key: string, value: string) => {
    const num = parseFloat(value)
    setMargins(prev => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'profit_margins',
          value: margins as unknown as Record<string, unknown>,
          description: 'Per-category profit margins as percentages. Key is category_id or "default".',
        }, { onConflict: 'key' })

      if (error) throw error
      toast.success('Profit margins saved')
      router.refresh()
    } catch (error) {
      console.error('Error saving profit margins:', error)
      toast.error('Failed to save profit margins')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Default Profit Margin
          </CardTitle>
          <CardDescription>
            Applied when no category-specific margin is set
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <Input
              type="number"
              min="0"
              max="1000"
              step="1"
              value={margins.default}
              onChange={(e) => updateMargin('default', e.target.value)}
              className="text-lg font-semibold"
            />
            <span className="text-lg text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Margins</CardTitle>
            <CardDescription>
              Set specific profit margins per category. Leave empty to use the default.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[160px]">Margin %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.product_type === 'raw_material' ? 'Raw Material' : 'Finished Product'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="1000"
                          step="1"
                          value={margins[category.id] ?? ''}
                          onChange={(e) => updateMargin(category.id, e.target.value)}
                          placeholder={`${margins.default}`}
                          className="h-8 w-24"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Margins'}
        </Button>
      </div>
    </div>
  )
}
