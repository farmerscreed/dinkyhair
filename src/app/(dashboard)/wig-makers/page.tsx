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
import { Plus, Eye, Scissors, Phone, Star, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import type { WigMaker } from '@/lib/supabase/types'
import { motion } from 'framer-motion'

export default function WigMakersPage() {
  const [wigMakers, setWigMakers] = useState<WigMaker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWigMakers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wig_makers')
        .select('*')
        .order('name')

      if (data) setWigMakers(data)
      setLoading(false)
    }
    fetchWigMakers()
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
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Wig Makers</h2>
          <p className="text-muted-foreground mt-1">
            Manage your production team
          </p>
        </div>
        <Button asChild size="lg" variant="neon" className="shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)]">
          <Link href="/wig-makers/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Wig Maker
          </Link>
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-accent" />
              Wig Maker List
            </CardTitle>
            <CardDescription>
              {wigMakers.length} maker{wigMakers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {wigMakers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 m-4 rounded-lg border border-dashed border-white/10">
                <p className="text-muted-foreground mb-4">No wig makers found</p>
                <Button asChild variant="secondary">
                  <Link href="/wig-makers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Wig Maker
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white/60 pl-6">Name</TableHead>
                    <TableHead className="text-white/60">Phone</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">Specialty</TableHead>
                    <TableHead className="text-white/60">Joined</TableHead>
                    <TableHead className="text-right text-white/60 pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wigMakers.map((maker) => (
                    <TableRow key={maker.id} className="hover:bg-white/5 border-white/10 transition-colors group">
                      <TableCell className="font-medium text-white/90 pl-6 group-hover:text-accent transition-colors">
                        {maker.name}
                      </TableCell>
                      <TableCell className="text-white/70">
                        {maker.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-white/40" />
                            {maker.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={maker.is_active ? 'default' : 'destructive'} className={maker.is_active ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : ''}>
                          {maker.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-white/60 italic">
                        {maker.specialty || 'General'}
                      </TableCell>
                      <TableCell className="text-white/60">
                        {format(new Date(maker.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon-sm" asChild className="hover:bg-white/10 hover:text-accent hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <Link href={`/wig-makers/${maker.id}`}>
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
