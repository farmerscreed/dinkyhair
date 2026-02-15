// SKU Configuration for Hair Products

export const hairOrigins = [
  { code: 'IN', name: 'Indian' },
  { code: 'VN', name: 'Vietnamese' },
  { code: 'CB', name: 'Cambodian' },
  { code: 'PH', name: 'Philippines' },
  { code: 'BM', name: 'Burmese' },
  { code: 'MG', name: 'Malagasy' },
  { code: 'SL', name: 'Slavic' },
  { code: 'ID', name: 'Indonesian' },
  { code: 'CN', name: 'Chinese' },
] as const

export const hairTextures = [
  // Curly
  { code: 'TC', name: 'Tight Curly', category: 'Curly' },
  { code: 'KC', name: 'Kinky Curly', category: 'Curly' },
  { code: 'PC', name: 'Pixie Curly', category: 'Curly' },
  // Straight
  { code: 'BS', name: 'Bone Straight', category: 'Straight' },
  { code: 'SD', name: 'SDD Straight', category: 'Straight' },
  { code: 'NS', name: 'Natural Straight', category: 'Straight' },
  // Wavy
  { code: 'DW', name: 'Deep Wavy', category: 'Wavy' },
  { code: 'NW', name: 'Natural Wavy', category: 'Wavy' },
  { code: 'LW', name: 'Loose Wavy', category: 'Wavy' },
] as const

export const hairLengths = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40] as const

export const hairColors = [
  { code: 'NAT', name: 'Natural (1B)' },
  { code: '613', name: '613 Blonde' },
  { code: 'OMB', name: 'Ombre' },
  { code: 'NBR', name: 'Natural Brown' },
  { code: 'BUR', name: 'Burgundy' },
] as const

export const hairForms = [
  { code: 'BUN', name: 'Bundle', hasSize: false, hasCustomName: false },
  { code: 'CLO', name: 'Closure', hasSize: true, sizeType: 'input', hasCustomName: false },
  { code: 'FRO', name: 'Frontal', hasSize: true, sizeType: 'select', sizeOptions: ['13x4', '13x6'], hasCustomName: false },
  { code: 'WIG', name: 'Full Wig', hasSize: false, hasCustomName: true },
] as const

export type HairOriginCode = typeof hairOrigins[number]['code'] | string
export type HairTextureCode = typeof hairTextures[number]['code'] | string
export type HairLength = typeof hairLengths[number]
export type HairColorCode = typeof hairColors[number]['code'] | string
export type HairFormCode = typeof hairForms[number]['code']

export interface HairAttributes {
  origin: string
  originCode: string
  texture: string
  textureCode: string
  length: number
  color: string
  colorCode: string
  form: string
  formCode: string
  formSize?: string
  wigName?: string
}

export function generateSKU(attrs: HairAttributes): string {
  const lengthStr = attrs.length.toString().padStart(2, '0')
  let sku = `${attrs.originCode}-${attrs.textureCode}-${lengthStr}-${attrs.colorCode}-${attrs.formCode}`

  if (attrs.formSize) {
    sku += `-${attrs.formSize.toUpperCase().replace('X', 'X')}`
  }

  if (attrs.wigName) {
    // Sanitize wig name: uppercase, remove special chars, limit length
    const sanitizedName = attrs.wigName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10)
    sku += `-${sanitizedName}`
  }

  return sku
}

export function generateProductName(attrs: HairAttributes): string {
  let name = `${attrs.origin} ${attrs.texture} ${attrs.length}"`

  if (attrs.color !== 'Natural (1B)') {
    name += ` ${attrs.color}`
  }

  name += ` ${attrs.form}`

  if (attrs.formSize) {
    name += ` ${attrs.formSize}`
  }

  if (attrs.wigName) {
    name += ` "${attrs.wigName}"`
  }

  return name
}

export function getOriginName(code: string): string {
  const origin = hairOrigins.find(o => o.code === code)
  return origin?.name || code
}

export function getTextureName(code: string): string {
  const texture = hairTextures.find(t => t.code === code)
  return texture?.name || code
}

export function getColorName(code: string): string {
  const color = hairColors.find(c => c.code === code)
  return color?.name || code
}

export function getFormName(code: string): string {
  const form = hairForms.find(f => f.code === code)
  return form?.name || code
}
