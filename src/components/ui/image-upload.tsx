'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  bucket = 'product-images',
  folder = 'products',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      onChange(publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // Extract path from URL
      const url = new URL(value)
      const pathParts = url.pathname.split('/storage/v1/object/public/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1].replace(`${bucket}/`, '')

        // Delete from storage
        await supabase.storage
          .from(bucket)
          .remove([filePath])
      }

      onChange(null)
      toast.success('Image removed')
    } catch (error) {
      console.error('Error removing image:', error)
      // Still remove from form even if delete fails
      onChange(null)
    }
  }

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-lg border bg-muted">
          <Image
            src={value}
            alt="Product image"
            fill
            className="object-cover"
            sizes="200px"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleRemove}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-square w-full max-w-[200px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-sm">Upload Image</span>
              <span className="text-xs">Max 5MB</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
