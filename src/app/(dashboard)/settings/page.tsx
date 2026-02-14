'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExchangeRateSettings } from './_components/exchange-rate-settings'
import { BusinessSettings } from './_components/business-settings'
import { ProfileSettings } from './_components/profile-settings'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [exchangeRates, setExchangeRates] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const [profileRes, exchangeRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user?.id).single(),
        supabase.from('exchange_rates').select('*').order('effective_date', { ascending: false }).limit(10),
        supabase.from('settings').select('*')
      ])

      setProfile(profileRes.data)
      setExchangeRates(exchangeRes.data || [])
      setSettings(settingsRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const businessName = settings?.find(s => s.key === 'business_name')?.value?.name || ''
  const businessAddress = settings?.find(s => s.key === 'business_address')?.value?.address || ''
  const businessPhone = settings?.find(s => s.key === 'business_phone')?.value?.phone || ''

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={item}>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your account and business settings
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 backdrop-blur-md w-full sm:w-auto flex-wrap h-auto">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex-1 sm:flex-none">Profile</TabsTrigger>
            <TabsTrigger value="business" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary flex-1 sm:flex-none">Business</TabsTrigger>
            <TabsTrigger value="exchange" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent flex-1 sm:flex-none">Exchange Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="glass p-6 rounded-xl border border-white/10">
              <ProfileSettings profile={profile} />
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="glass p-6 rounded-xl border border-white/10">
              <BusinessSettings
                businessName={businessName}
                businessAddress={businessAddress}
                businessPhone={businessPhone}
              />
            </div>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-4">
            <div className="glass p-6 rounded-xl border border-white/10">
              <ExchangeRateSettings exchangeRates={exchangeRates || []} />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
