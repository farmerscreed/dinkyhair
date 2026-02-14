'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface BusinessSettingsProps {
  businessName: string
  businessAddress: string
  businessPhone: string
}

export function BusinessSettings({
  businessName,
  businessAddress,
  businessPhone,
}: BusinessSettingsProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: businessName,
    address: businessAddress,
    phone: businessPhone,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upsert business settings
      const settings = [
        { key: 'business_name', value: { name: formData.name }, description: 'Business name' },
        { key: 'business_address', value: { address: formData.address }, description: 'Business address' },
        { key: 'business_phone', value: { phone: formData.phone }, description: 'Business phone' },
      ]

      for (const setting of settings) {
        const { error } = await supabase
          .from('settings')
          .upsert(setting, { onConflict: 'key' })

        if (error) throw error
      }

      toast.success('Business settings updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Error updating business settings:', error)
      toast.error('Failed to update business settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Configure your business details for receipts and reports
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="DinkyHair"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_address">Business Address</Label>
            <Input
              id="business_address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter business address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_phone">Business Phone</Label>
            <Input
              id="business_phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter business phone"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
