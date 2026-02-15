export type UserRole = 'owner' | 'staff'
export type ProductType = 'raw_material' | 'finished_product'
export type ProductionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'credit'
export type SalesChannel = 'in_store' | 'online' | 'wholesale'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WigMaker {
  id: string
  name: string
  phone: string | null
  email: string | null
  specialization: string | null
  rate_per_wig: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  product_type: ProductType
  created_at: string
  updated_at: string
}

export interface Batch {
  id: string
  batch_number: string
  supplier_id: string | null
  purchase_date: string
  total_cost_usd: number | null
  exchange_rate: number | null
  total_cost_ngn: number | null
  notes: string | null
  created_at: string
  updated_at: string
  supplier?: Supplier
}

export interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  product_type: ProductType
  category_id: string | null
  batch_id: string | null
  cost_price_usd: number | null
  cost_price_ngn: number | null
  selling_price: number | null
  quantity_in_stock: number
  reorder_level: number
  image_url: string | null
  is_active: boolean
  // Hair attributes for SKU
  hair_origin: string | null
  hair_texture: string | null
  hair_length: number | null
  hair_color: string | null
  hair_form: string | null
  hair_form_size: string | null
  hair_wig_name: string | null
  created_at: string
  updated_at: string
  category?: Category
  batch?: Batch
}

export interface Production {
  id: string
  production_number: string
  wig_maker_id: string | null
  product_id: string | null
  status: ProductionStatus
  start_date: string | null
  expected_completion: string | null
  actual_completion: string | null
  labor_cost: number | null
  materials_used: Record<string, unknown> | null
  notes: string | null
  created_at: string
  updated_at: string
  wig_maker?: WigMaker
  product?: Product
}

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  total_purchases: number
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  sale_number: string
  customer_id: string | null
  sale_date: string
  subtotal: number
  discount: number
  total: number
  payment_method: PaymentMethod
  sales_channel: SalesChannel
  staff_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  customer?: Customer
  staff?: Profile
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}

export interface ExchangeRate {
  id: string
  rate: number
  effective_date: string
  notes: string | null
  created_at: string
}

export interface Settings {
  id: string
  key: string
  value: Record<string, unknown>
  description: string | null
  updated_at: string
}
