'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
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
import { Plus, Eye, Users, Phone, Mail, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import type { Customer } from '@/lib/supabase/types'
import { motion } from 'framer-motion'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCustomers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')

      if (data) setCustomers(data)
      setLoading(false)
    }
    fetchCustomers()
  }, [])

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
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Customers</h2>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <Button asChild size="lg" variant="neon" className="shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)]">
          <Link href="/customers/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Customer
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              Customer List
            </CardTitle>
            <CardDescription>
              {customers.length} customer{customers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 m-4 rounded-lg border border-dashed border-white/10">
                <p className="text-muted-foreground mb-4">No customers found</p>
                <Button asChild variant="secondary">
                  <Link href="/customers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60 pl-6">Name</TableHead>
                    <TableHead className="text-white/60">Phone</TableHead>
                    <TableHead className="text-white/60">Email</TableHead>
                    <TableHead className="text-white/60">Preferences</TableHead>
                    <TableHead className="text-white/60">Added</TableHead>
                    <TableHead className="text-right text-white/60 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-white/5 border-white/10 transition-colors group">
                      <TableCell className="font-medium text-white/90 pl-6 group-hover:text-primary transition-colors">
                        {customer.name}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-white/40" />
                            {customer.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-white/40" />
                            {customer.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-white/60 italic">
                        {customer.preferences || '-'}
                      </TableCell>
                      <TableCell className="text-white/60">
                        {format(new Date(customer.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon-sm" asChild className="hover:bg-white/10 hover:text-secondary hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                          <Link href={`/customers/${customer.id}`}>
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
      </motion.div>
    </motion.div>
  )
}
