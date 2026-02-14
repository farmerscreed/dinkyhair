import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WigMakerForm } from '../_components/wig-maker-form'

interface EditWigMakerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditWigMakerPage({ params }: EditWigMakerPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: wigMaker, error } = await supabase
    .from('wig_makers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !wigMaker) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Wig Maker</h2>
        <p className="text-muted-foreground">
          Update wig maker information
        </p>
      </div>

      <WigMakerForm wigMaker={wigMaker} />
    </div>
  )
}
