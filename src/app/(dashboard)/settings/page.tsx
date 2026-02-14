import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExchangeRateSettings } from './_components/exchange-rate-settings'
import { BusinessSettings } from './_components/business-settings'
import { ProfileSettings } from './_components/profile-settings'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch current user profile
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch exchange rates
  const { data: exchangeRates } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('effective_date', { ascending: false })
    .limit(10)

  // Fetch business settings
  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  const businessName = settings?.find(s => s.key === 'business_name')?.value?.name || ''
  const businessAddress = settings?.find(s => s.key === 'business_address')?.value?.address || ''
  const businessPhone = settings?.find(s => s.key === 'business_phone')?.value?.phone || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and business settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="exchange">Exchange Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings profile={profile} />
        </TabsContent>

        <TabsContent value="business">
          <BusinessSettings
            businessName={businessName}
            businessAddress={businessAddress}
            businessPhone={businessPhone}
          />
        </TabsContent>

        <TabsContent value="exchange">
          <ExchangeRateSettings exchangeRates={exchangeRates || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
