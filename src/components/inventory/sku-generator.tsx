'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  hairOrigins,
  hairTextures,
  hairLengths,
  hairColors,
  hairForms,
  generateSKU,
  generateProductName,
  type HairAttributes,
} from '@/lib/sku-config'
import {
  Globe,
  Waves,
  Ruler,
  Palette,
  Package,
  Sparkles,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react'

interface SKUGeneratorProps {
  onComplete: (data: {
    sku: string
    name: string
    attributes: HairAttributes
  }) => void
  onCancel: () => void
  initialData?: Partial<HairAttributes>
}

type Step = 'origin' | 'texture' | 'length' | 'color' | 'form' | 'details' | 'preview'

const steps: { key: Step; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'origin', label: 'Origin', icon: Globe },
  { key: 'texture', label: 'Texture', icon: Waves },
  { key: 'length', label: 'Length', icon: Ruler },
  { key: 'color', label: 'Color', icon: Palette },
  { key: 'form', label: 'Form', icon: Package },
  { key: 'details', label: 'Details', icon: Sparkles },
  { key: 'preview', label: 'Preview', icon: Check },
]

export function SKUGenerator({ onComplete, onCancel, initialData }: SKUGeneratorProps) {
  const [currentStep, setCurrentStep] = useState<Step>('origin')
  const [customOrigin, setCustomOrigin] = useState('')
  const [customTexture, setCustomTexture] = useState('')
  const [customColor, setCustomColor] = useState('')

  const [attributes, setAttributes] = useState<Partial<HairAttributes>>({
    origin: initialData?.origin || '',
    originCode: initialData?.originCode || '',
    texture: initialData?.texture || '',
    textureCode: initialData?.textureCode || '',
    length: initialData?.length || undefined,
    color: initialData?.color || '',
    colorCode: initialData?.colorCode || '',
    form: initialData?.form || '',
    formCode: initialData?.formCode || '',
    formSize: initialData?.formSize || '',
    wigName: initialData?.wigName || '',
  })

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)
  const selectedForm = hairForms.find(f => f.code === attributes.formCode)
  const needsDetails = selectedForm?.hasSize || selectedForm?.hasCustomName

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'origin':
        return !!attributes.originCode
      case 'texture':
        return !!attributes.textureCode
      case 'length':
        return !!attributes.length
      case 'color':
        return !!attributes.colorCode
      case 'form':
        return !!attributes.formCode
      case 'details':
        if (selectedForm?.hasSize && !attributes.formSize) return false
        if (selectedForm?.hasCustomName && !attributes.wigName) return false
        return true
      case 'preview':
        return true
      default:
        return false
    }
  }

  const goNext = () => {
    const stepOrder: Step[] = ['origin', 'texture', 'length', 'color', 'form', 'details', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)

    if (currentStep === 'form' && !needsDetails) {
      setCurrentStep('preview')
    } else if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1])
    }
  }

  const goBack = () => {
    const stepOrder: Step[] = ['origin', 'texture', 'length', 'color', 'form', 'details', 'preview']
    const currentIndex = stepOrder.indexOf(currentStep)

    if (currentStep === 'preview' && !needsDetails) {
      setCurrentStep('form')
    } else if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }

  const handleComplete = () => {
    if (!attributes.originCode || !attributes.textureCode || !attributes.length || !attributes.colorCode || !attributes.formCode) {
      return
    }

    const fullAttrs: HairAttributes = {
      origin: attributes.origin!,
      originCode: attributes.originCode,
      texture: attributes.texture!,
      textureCode: attributes.textureCode,
      length: attributes.length,
      color: attributes.color!,
      colorCode: attributes.colorCode,
      form: attributes.form!,
      formCode: attributes.formCode,
      formSize: attributes.formSize,
      wigName: attributes.wigName,
    }

    onComplete({
      sku: generateSKU(fullAttrs),
      name: generateProductName(fullAttrs),
      attributes: fullAttrs,
    })
  }

  const selectOrigin = (code: string, name: string) => {
    setAttributes(prev => ({ ...prev, originCode: code, origin: name }))
  }

  const selectTexture = (code: string, name: string) => {
    setAttributes(prev => ({ ...prev, textureCode: code, texture: name }))
  }

  const selectLength = (length: number) => {
    setAttributes(prev => ({ ...prev, length }))
  }

  const selectColor = (code: string, name: string) => {
    setAttributes(prev => ({ ...prev, colorCode: code, color: name }))
  }

  const selectForm = (code: string, name: string) => {
    setAttributes(prev => ({ ...prev, formCode: code, form: name, formSize: '', wigName: '' }))
  }

  // Generate preview SKU
  const previewSKU = attributes.originCode && attributes.textureCode && attributes.length && attributes.colorCode && attributes.formCode
    ? generateSKU(attributes as HairAttributes)
    : null

  return (
    <div className="relative">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.filter(s => s.key !== 'details' || needsDetails).map((step, idx) => {
            const stepIdx = steps.findIndex(s => s.key === step.key)
            const isActive = step.key === currentStep
            const isCompleted = currentStepIndex > stepIdx

            return (
              <div key={step.key} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                  isActive && 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30',
                  isCompleted && 'bg-emerald-500 text-white',
                  !isActive && !isCompleted && 'bg-white/10 text-white/40'
                )}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {idx < steps.filter(s => s.key !== 'details' || needsDetails).length - 1 && (
                  <div className={cn(
                    'w-8 h-0.5 mx-2 transition-all duration-300',
                    isCompleted ? 'bg-emerald-500' : 'bg-white/10'
                  )} />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-center text-sm text-white/60 mt-4">
          {steps.find(s => s.key === currentStep)?.label}
        </p>
      </div>

      {/* Live SKU Preview */}
      {previewSKU && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">SKU Preview</p>
          <p className="text-xl font-mono font-bold text-white">{previewSKU}</p>
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Origin Selection */}
          {currentStep === 'origin' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Hair Origin</h3>
              <div className="grid grid-cols-3 gap-3">
                {hairOrigins.map(origin => (
                  <button
                    key={origin.code}
                    onClick={() => selectOrigin(origin.code, origin.name)}
                    className={cn(
                      'p-4 rounded-xl text-center transition-all duration-200 border',
                      attributes.originCode === origin.code
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <span className="block font-mono text-lg font-bold">{origin.code}</span>
                    <span className="block text-sm text-white/60">{origin.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Origin */}
              <div className="pt-4 border-t border-white/10">
                <Label className="text-white/60 text-sm">Or add custom origin</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Code (e.g., TH)"
                    value={customOrigin}
                    onChange={(e) => setCustomOrigin(e.target.value.toUpperCase().slice(0, 2))}
                    className="w-24 font-mono uppercase"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Name (e.g., Thai)"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customOrigin.length === 2) {
                        selectOrigin(customOrigin, (e.target as HTMLInputElement).value || customOrigin)
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (customOrigin.length === 2) {
                        selectOrigin(customOrigin, customOrigin)
                      }
                    }}
                    disabled={customOrigin.length !== 2}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Texture Selection */}
          {currentStep === 'texture' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Hair Texture</h3>

              {['Curly', 'Straight', 'Wavy'].map(category => (
                <div key={category}>
                  <p className="text-sm text-white/40 uppercase tracking-wider mb-2">{category}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {hairTextures.filter(t => t.category === category).map(texture => (
                      <button
                        key={texture.code}
                        onClick={() => selectTexture(texture.code, texture.name)}
                        className={cn(
                          'p-4 rounded-xl text-center transition-all duration-200 border',
                          attributes.textureCode === texture.code
                            ? 'bg-violet-500/20 border-violet-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                        )}
                      >
                        <span className="block font-mono text-lg font-bold">{texture.code}</span>
                        <span className="block text-sm text-white/60">{texture.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom Texture */}
              <div className="pt-4 border-t border-white/10">
                <Label className="text-white/60 text-sm">Or add custom texture</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Code (e.g., WC)"
                    value={customTexture}
                    onChange={(e) => setCustomTexture(e.target.value.toUpperCase().slice(0, 2))}
                    className="w-24 font-mono uppercase"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Name (e.g., Water Curly)"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customTexture.length === 2) {
                        selectTexture(customTexture, (e.target as HTMLInputElement).value || customTexture)
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (customTexture.length === 2) {
                        selectTexture(customTexture, customTexture)
                      }
                    }}
                    disabled={customTexture.length !== 2}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Length Selection */}
          {currentStep === 'length' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Length (inches)</h3>
              <div className="grid grid-cols-6 gap-2">
                {hairLengths.map(length => (
                  <button
                    key={length}
                    onClick={() => selectLength(length)}
                    className={cn(
                      'p-3 rounded-xl text-center transition-all duration-200 border font-mono font-bold',
                      attributes.length === length
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    {length}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {currentStep === 'color' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Color</h3>
              <div className="grid grid-cols-3 gap-3">
                {hairColors.map(color => (
                  <button
                    key={color.code}
                    onClick={() => selectColor(color.code, color.name)}
                    className={cn(
                      'p-4 rounded-xl text-center transition-all duration-200 border',
                      attributes.colorCode === color.code
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <span className="block font-mono text-lg font-bold">{color.code}</span>
                    <span className="block text-sm text-white/60">{color.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Color */}
              <div className="pt-4 border-t border-white/10">
                <Label className="text-white/60 text-sm">Or add custom color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Code (e.g., #27)"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value.toUpperCase().slice(0, 4))}
                    className="w-24 font-mono uppercase"
                    maxLength={4}
                  />
                  <Input
                    placeholder="Name (e.g., Honey Blonde)"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customColor.length >= 1) {
                        selectColor(customColor, (e.target as HTMLInputElement).value || customColor)
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (customColor.length >= 1) {
                        selectColor(customColor, customColor)
                      }
                    }}
                    disabled={customColor.length < 1}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Form Selection */}
          {currentStep === 'form' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Select Product Form</h3>
              <div className="grid grid-cols-2 gap-4">
                {hairForms.map(form => (
                  <button
                    key={form.code}
                    onClick={() => selectForm(form.code, form.name)}
                    className={cn(
                      'p-6 rounded-xl text-center transition-all duration-200 border',
                      attributes.formCode === form.code
                        ? 'bg-violet-500/20 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    )}
                  >
                    <span className="block font-mono text-2xl font-bold mb-1">{form.code}</span>
                    <span className="block text-sm text-white/60">{form.name}</span>
                    {form.hasSize && <span className="block text-xs text-white/40 mt-1">+ Size</span>}
                    {form.hasCustomName && <span className="block text-xs text-white/40 mt-1">+ Name</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Details (Size/Name) */}
          {currentStep === 'details' && selectedForm && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedForm.hasSize ? 'Enter Size' : 'Enter Wig Name'}
              </h3>

              {selectedForm.code === 'CLO' && (
                <div className="space-y-2">
                  <Label>Closure Size (e.g., 4x4, 5x5, 2x6)</Label>
                  <Input
                    placeholder="Enter size..."
                    value={attributes.formSize || ''}
                    onChange={(e) => setAttributes(prev => ({ ...prev, formSize: e.target.value.toUpperCase() }))}
                    className="font-mono text-lg"
                  />
                  <div className="flex gap-2 mt-2">
                    {['2x4', '2x6', '4x4', '5x5', '6x6', '7x7'].map(size => (
                      <Button
                        key={size}
                        variant={attributes.formSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAttributes(prev => ({ ...prev, formSize: size }))}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedForm.code === 'FRO' && (
                <div className="space-y-2">
                  <Label>Frontal Size</Label>
                  <div className="flex gap-4">
                    {['13x4', '13x6'].map(size => (
                      <button
                        key={size}
                        onClick={() => setAttributes(prev => ({ ...prev, formSize: size }))}
                        className={cn(
                          'flex-1 p-4 rounded-xl text-center transition-all duration-200 border font-mono text-lg font-bold',
                          attributes.formSize === size
                            ? 'bg-violet-500/20 border-violet-500 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedForm.code === 'WIG' && (
                <div className="space-y-2">
                  <Label>Custom Wig Name</Label>
                  <Input
                    placeholder="e.g., Queen, Luxe, Divine..."
                    value={attributes.wigName || ''}
                    onChange={(e) => setAttributes(prev => ({ ...prev, wigName: e.target.value }))}
                    className="text-lg"
                  />
                  <p className="text-xs text-white/40">
                    This name will be part of the SKU (max 10 characters, letters & numbers only)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {currentStep === 'preview' && previewSKU && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-4">Review & Confirm</h3>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Generated SKU</p>
                <p className="text-3xl font-mono font-bold text-white mb-4">{previewSKU}</p>

                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Product Name</p>
                <p className="text-lg text-white">{generateProductName(attributes as HairAttributes)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-white/40">Origin:</span>
                  <span className="ml-2 text-white">{attributes.origin}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-white/40">Texture:</span>
                  <span className="ml-2 text-white">{attributes.texture}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-white/40">Length:</span>
                  <span className="ml-2 text-white">{attributes.length}"</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-white/40">Color:</span>
                  <span className="ml-2 text-white">{attributes.color}</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-white/40">Form:</span>
                  <span className="ml-2 text-white">{attributes.form}</span>
                </div>
                {attributes.formSize && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-white/40">Size:</span>
                    <span className="ml-2 text-white">{attributes.formSize}</span>
                  </div>
                )}
                {attributes.wigName && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <span className="text-white/40">Wig Name:</span>
                    <span className="ml-2 text-white">{attributes.wigName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={currentStep === 'origin' ? onCancel : goBack}
        >
          {currentStep === 'origin' ? 'Cancel' : 'Back'}
        </Button>

        {currentStep === 'preview' ? (
          <Button
            onClick={handleComplete}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
