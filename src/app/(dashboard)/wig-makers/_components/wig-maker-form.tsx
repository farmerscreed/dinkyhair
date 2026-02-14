'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { WigMaker } from '@/lib/supabase/types'

interface WigMakerFormProps {
  wigMaker?: WigMaker
}

export function WigMakerForm({ wigMaker }: WigMakerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!wigMaker

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: wigMaker?.name || '',
    phone: wigMaker?.phone || '',
    email: wigMaker?.email || '',
    specialization: wigMaker?.specialization || '',
    rate_per_wig: wigMaker?.rate_per_wig?.toString() || '',
    notes: wigMaker?.notes || '',
    is_active: wigMaker?.is_active ?? true,
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
      phone: formData.phone || null,
      email: formData.email || null,
      specialization: formData.specialization || null,
      rate_per_wig: formData.rate_per_wig ? parseFloat(formData.rate_per_wig) : null,
      notes: formData.notes || null,
      is_active: formData.is_active,
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('wig_makers')
          .update(submitData)
          .eq('id', wigMaker.id)

        if (error) throw error
        toast.success('Wig maker updated successfully')
      } else {
        const { error } = await supabase
          .from('wig_makers')
          .insert(submitData)

        if (error) throw error
        toast.success('Wig maker created successfully')
      }

      router.push('/wig-makers')
      router.refresh()
    } catch (error) {
      console.error('Error saving wig maker:', error)
      toast.error('Failed to save wig maker')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!wigMaker || !confirm('Are you sure you want to delete this wig maker?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('wig_makers')
        .delete()
        .eq('id', wigMaker.id)

      if (error) throw error
      toast.success('Wig maker deleted successfully')
      router.push('/wig-makers')
      router.refresh()
    } catch (error) {
      console.error('Error deleting wig maker:', error)
      toast.error('Failed to delete wig maker')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter wig maker name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Frontal Wigs, Full Lace, Closures"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_per_wig">Rate per Wig (NGN)</Label>
              <Input
                id="rate_per_wig"
                name="rate_per_wig"
                type="number"
                min="0"
                step="100"
                value={formData.rate_per_wig}
                onChange={handleChange}
                placeholder="Enter rate per wig"
              />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this wig maker"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
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
              {loading ? 'Saving...' : isEditing ? 'Update Wig Maker' : 'Create Wig Maker'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
