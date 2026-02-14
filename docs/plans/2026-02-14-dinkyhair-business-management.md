# DinkyHair Business Management System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete business management system for DinkyHair - a hair company that sources, produces, and sells hair products through social media and physical store.

**Architecture:** Mobile-first Next.js PWA with Supabase backend. Role-based access (Owner/Staff). Modular design with Suppliers → Inventory → Production → Sales flow. Real-time cost tracking with USD/NGN currency support.

**Tech Stack:** Next.js 14 (App Router), Supabase (Auth, PostgreSQL, Storage), Tailwind CSS, shadcn/ui components, TypeScript

---

## Product Requirements Document (PRD)

### Business Overview
DinkyHair is a hair company that:
- Sources raw materials (bundles, frontals, wigs) from international suppliers (Philippines, Brazil, China, etc.)
- Produces custom wigs using wig makers
- Sells via social media channels and physical store
- Needs comprehensive business management with cost tracking and profitability analysis

### User Roles
| Role | Permissions |
|------|-------------|
| Owner | Full access to all features including financials, analytics, settings |
| Staff | Sales recording, inventory viewing, customer management (no financial reports) |

### Core Modules

#### 1. Supplier Management
- Add/edit/delete suppliers
- Track: Name, location/country, contact info, payment terms
- View purchase history per supplier
- Supplier performance metrics

#### 2. Inventory Management
- **Product Types:** Bundles, Frontals, Wigs (sourced), Wigs (produced)
- **Attributes:** Type, Length, Color, Origin, Texture, Grade, Weight, Density, Custom specs
- **Batch Tracking:** Each shipment is a batch with batch number, supplier, date, costs
- **Stock Levels:** Real-time stock with low-stock alerts
- **Images:** Product photos stored in Supabase Storage

#### 3. Cost Tracking (Full Breakdown)
- Purchase price (USD)
- Shipping cost
- Customs/duties
- Wig maker fee (for produced wigs)
- Packaging cost
- Other overhead
- **Currency:** Purchases in USD, sales in NGN, with conversion rate tracking

#### 4. Production (Wig Making)
- Create production order: Select frontal + bundles
- Assign to wig maker
- Track materials used (deduct from inventory)
- Calculate total production cost
- Mark complete → Add finished wig to inventory

#### 5. Wig Maker Management
- Multiple wig makers
- Track: Name, contact, rates/fees
- Production history
- Payment tracking

#### 6. Sales & Invoicing
- Record sale with invoice generation
- Select product(s) from inventory
- Attach customer
- Payment method (Cash, Transfer, Card, etc.)
- Sales channel (Instagram, WhatsApp, Store, etc.)
- Auto-calculate profit margin
- Generate receipt/invoice

#### 7. Customer Management
- Basic info: Name, phone, email
- Purchase history
- Notes

#### 8. Analytics & Reporting (Owner Only)
- **Dashboard:** Today's sales, month-to-date, inventory value, low stock alerts
- **Sales Trends:** Daily/weekly/monthly charts
- **Best Sellers:** Top products by revenue and quantity
- **Profit Analysis:** Margin per product, per supplier source
- **Supplier Performance:** Cost comparison, delivery time
- **Production Efficiency:** Wig maker performance, production costs

#### 9. Landing Page (Public)
- Modern, clean product showcase
- Featured products from inventory
- WhatsApp/Instagram DM redirect for orders
- Mobile-optimized
- "Contact to Order" flow

### Technical Requirements
- Mobile-first responsive design
- PWA capability (installable on mobile)
- Offline-capable for critical features
- Simple, intuitive UI for non-technical users
- Modern, clean aesthetics
- Fast performance

---

## Database Schema

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'staff');
CREATE TYPE product_type AS ENUM ('bundle', 'frontal', 'wig_sourced', 'wig_produced');
CREATE TYPE production_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card', 'other');
CREATE TYPE sales_channel AS ENUM ('instagram', 'whatsapp', 'facebook', 'store', 'other');

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wig Makers
CREATE TABLE wig_makers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  rate_per_wig DECIMAL(10,2), -- in NGN
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories (for organization)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches (shipments from suppliers)
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE NOT NULL,
  arrival_date DATE,
  purchase_price_usd DECIMAL(10,2) NOT NULL,
  shipping_cost_usd DECIMAL(10,2) DEFAULT 0,
  customs_cost_usd DECIMAL(10,2) DEFAULT 0,
  other_costs_usd DECIMAL(10,2) DEFAULT 0,
  exchange_rate DECIMAL(10,2), -- USD to NGN at time of purchase
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (inventory items)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  product_type product_type NOT NULL,
  category_id UUID REFERENCES categories(id),
  batch_id UUID REFERENCES batches(id),

  -- Attributes
  length_inches INTEGER,
  color TEXT,
  texture TEXT, -- straight, wavy, curly, kinky
  grade TEXT, -- quality grade
  weight_grams DECIMAL(6,2),
  density TEXT, -- 150%, 180%, etc.
  origin_country TEXT,
  custom_specs JSONB, -- for additional attributes

  -- Pricing
  cost_price_ngn DECIMAL(10,2), -- calculated from batch + overhead
  selling_price_ngn DECIMAL(10,2),

  -- Stock
  quantity_in_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 2,

  -- For produced wigs
  production_id UUID, -- links to production record

  -- Media
  image_urls TEXT[],

  -- Display
  is_featured BOOLEAN DEFAULT FALSE, -- show on landing page
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production Orders (wig making)
CREATE TABLE productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_number TEXT NOT NULL UNIQUE,
  wig_maker_id UUID REFERENCES wig_makers(id),
  status production_status DEFAULT 'pending',

  -- Materials used
  frontal_product_id UUID REFERENCES products(id),
  bundle_product_ids UUID[], -- array of bundle product IDs

  -- Costs
  wig_maker_fee_ngn DECIMAL(10,2),
  packaging_cost_ngn DECIMAL(10,2) DEFAULT 0,
  other_costs_ngn DECIMAL(10,2) DEFAULT 0,
  total_cost_ngn DECIMAL(10,2), -- calculated

  -- Resulting product
  result_product_id UUID REFERENCES products(id),

  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram_handle TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales / Invoices
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),

  -- Sale details
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  sales_channel sales_channel NOT NULL,
  payment_method payment_method NOT NULL,

  -- Totals
  subtotal_ngn DECIMAL(10,2) NOT NULL,
  discount_ngn DECIMAL(10,2) DEFAULT 0,
  total_ngn DECIMAL(10,2) NOT NULL,
  total_cost_ngn DECIMAL(10,2), -- sum of cost prices
  profit_ngn DECIMAL(10,2), -- calculated

  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items (line items)
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_ngn DECIMAL(10,2) NOT NULL,
  cost_price_ngn DECIMAL(10,2), -- snapshot of cost at time of sale
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange Rates (for USD/NGN tracking)
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate DECIMAL(10,2) NOT NULL, -- 1 USD = X NGN
  effective_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Foundation (Tasks 1-8)
Project setup, Supabase integration, authentication, base UI

### Phase 2: Core Data Management (Tasks 9-16)
Suppliers, categories, wig makers, exchange rates

### Phase 3: Inventory System (Tasks 17-24)
Batches, products, stock management

### Phase 4: Production System (Tasks 25-30)
Wig production workflow

### Phase 5: Sales & Customers (Tasks 31-40)
Customer management, sales recording, invoicing

### Phase 6: Analytics & Dashboard (Tasks 41-46)
Reports, charts, insights

### Phase 7: Landing Page (Tasks 47-52)
Public storefront

### Phase 8: Polish & PWA (Tasks 53-56)
PWA setup, final polish

---

## Phase 1: Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Select: Yes to all defaults

**Step 2: Verify installation**

```bash
npm run dev
```

Expected: Dev server starts on localhost:3000

**Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Supabase and UI dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-label @radix-ui/react-checkbox
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install date-fns
npm install zod react-hook-form @hookform/resolvers
npm install recharts
```

**Step 2: Verify packages installed**

```bash
npm list @supabase/supabase-js
```

Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Supabase, Radix UI, and utility dependencies"
```

---

### Task 3: Setup shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

**Step 2: Add essential components**

```bash
npx shadcn@latest add button input card label select dialog dropdown-menu tabs toast form table badge
```

**Step 3: Verify component exists**

```bash
ls src/components/ui/
```

Expected: Lists button.tsx, input.tsx, etc.

**Step 4: Commit**

```bash
git add .
git commit -m "chore: setup shadcn/ui with essential components"
```

---

### Task 4: Configure Supabase Client

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `.env.local`
- Modify: `middleware.ts`

**Step 1: Create environment file**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vqoooewkcuduldgmnfvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Step 2: Create browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Create server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component
          }
        },
      },
    }
  )
}
```

**Step 4: Create middleware helper**

Create `src/lib/supabase/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if accessing protected routes without auth
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 5: Create middleware**

Create `src/middleware.ts`:
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 6: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: configure Supabase client for browser, server, and middleware"
```

Note: Do NOT commit .env.local

---

### Task 5: Create Database Schema

**Files:**
- Database migrations via Supabase

**Step 1: Apply core schema migration**

Use Supabase MCP tool `apply_migration` with the full schema from the Database Schema section above.

**Step 2: Verify tables created**

Use Supabase MCP tool `list_tables` to confirm all tables exist.

**Step 3: Document migration**

The migration will be tracked in Supabase automatically.

---

### Task 6: Setup Row Level Security (RLS)

**Files:**
- Database policies via Supabase

**Step 1: Apply RLS policies migration**

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wig_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read own profile, owners can read all
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role() = 'owner');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Suppliers: All authenticated users can view, only owners can modify
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'owner');

CREATE POLICY "Owners can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'owner');

CREATE POLICY "Owners can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (get_user_role() = 'owner');

-- Similar policies for other tables...
-- Categories, Wig Makers, Batches, Products: Same as suppliers
-- Customers, Sales, Sale Items: All authenticated can CRUD
-- Exchange Rates, Settings: Owners only for write, all can read

-- Products: All authenticated can view
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can manage products"
  ON products FOR ALL
  TO authenticated
  USING (get_user_role() = 'owner')
  WITH CHECK (get_user_role() = 'owner');

-- Customers: All authenticated can manage
CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sales: All authenticated can manage
CREATE POLICY "Authenticated users can manage sales"
  ON sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public access for landing page products
CREATE POLICY "Public can view featured active products"
  ON products FOR SELECT
  TO anon
  USING (is_active = true AND is_featured = true);
```

**Step 2: Verify policies**

Use Supabase MCP tool `get_advisors` with type "security" to check for issues.

---

### Task 7: Create Auth Trigger for Profiles

**Files:**
- Database function and trigger via Supabase

**Step 1: Create profile creation trigger**

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Step 2: Test by checking existing setup**

The trigger will fire automatically when new users sign up.

---

### Task 8: Create Base Layout and Navigation

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Modify: `src/app/globals.css`

**Step 1: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile} className="hidden lg:flex" />

      {/* Main Content */}
      <div className="lg:pl-64">
        <Header profile={profile} />
        <main className="p-4 pb-20 lg:pb-4">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav className="lg:hidden" />
    </div>
  )
}
```

**Step 2: Create sidebar component**

Create `src/components/layout/sidebar.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  Scissors,
  ShoppingCart,
  BarChart3,
  Settings,
  Truck,
  Layers,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: Truck },
  { name: 'Production', href: '/dashboard/production', icon: Scissors },
  { name: 'Wig Makers', href: '/dashboard/wig-makers', icon: Users },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Batches', href: '/dashboard/batches', icon: Layers },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, ownerOnly: true },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, ownerOnly: true },
]

interface SidebarProps {
  profile: { role: string; full_name: string } | null
  className?: string
}

export function Sidebar({ profile, className }: SidebarProps) {
  const pathname = usePathname()
  const isOwner = profile?.role === 'owner'

  const filteredNav = navigation.filter(
    (item) => !item.ownerOnly || isOwner
  )

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col', className)}>
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-900">DinkyHair</h1>
        <p className="text-sm text-gray-500 mt-1">{profile?.full_name}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

**Step 3: Create header component**

Create `src/components/layout/header.tsx`:
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'

interface HeaderProps {
  profile: { role: string; full_name: string } | null
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="lg:hidden">
        <h1 className="text-xl font-bold">DinkyHair</h1>
      </div>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{profile?.full_name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

**Step 4: Create mobile navigation**

Create `src/components/layout/mobile-nav.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MoreHorizontal,
} from 'lucide-react'

const mobileNav = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'More', href: '/dashboard/more', icon: MoreHorizontal },
]

interface MobileNavProps {
  className?: string
}

export function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 bg-white border-t z-50', className)}>
      <div className="flex items-center justify-around py-2">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
                isActive ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 5: Commit**

```bash
git add src/app/(dashboard)/ src/components/layout/
git commit -m "feat: add dashboard layout with sidebar and mobile navigation"
```

---

## Phase 2: Core Data Management

### Task 9: Create Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`

**Step 1: Create login actions**

Create `src/app/login/actions.ts`:
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
        role: 'owner', // First user is owner
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

**Step 2: Create login page**

Create `src/app/login/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (action: typeof login | typeof signup, formData: FormData) => {
    setLoading(true)
    setError(null)
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">DinkyHair</CardTitle>
          <CardDescription>Business Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form
                action={(formData) => handleSubmit(login, formData)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form
                action={(formData) => handleSubmit(signup, formData)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/login/
git commit -m "feat: add login and signup pages with Supabase auth"
```

---

### Task 10: Create Dashboard Home Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Create dashboard page**

Create `src/app/(dashboard)/dashboard/page.tsx`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, DollarSign, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get counts
  const [
    { count: productCount },
    { count: saleCount },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('sales').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('id').lt('quantity_in_stock', 3).eq('is_active', true),
  ])

  const stats = [
    {
      title: 'Total Products',
      value: productCount ?? 0,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'Total Sales',
      value: saleCount ?? 0,
      icon: ShoppingCart,
      color: 'text-green-600',
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts?.length ?? 0,
      icon: AlertTriangle,
      color: 'text-yellow-600',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <a
            href="/dashboard/sales/new"
            className="p-4 bg-gray-900 text-white rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
          >
            Record Sale
          </a>
          <a
            href="/dashboard/inventory/new"
            className="p-4 bg-white border rounded-lg text-center font-medium hover:bg-gray-50 transition-colors"
          >
            Add Product
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/(dashboard)/dashboard/
git commit -m "feat: add dashboard home page with stats and quick actions"
```

---

### Task 11-16: Suppliers, Categories, Wig Makers CRUD

Due to length constraints, these follow the same pattern:
- Create page at `src/app/(dashboard)/dashboard/[module]/page.tsx` - List view
- Create page at `src/app/(dashboard)/dashboard/[module]/new/page.tsx` - Create form
- Create page at `src/app/(dashboard)/dashboard/[module]/[id]/page.tsx` - Edit form
- Create actions at `src/app/(dashboard)/dashboard/[module]/actions.ts`

Each module includes:
- List view with search
- Create form with validation
- Edit form
- Delete confirmation
- Mobile-optimized cards

---

## Phase 3-8: Remaining Tasks

The remaining phases follow the same bite-sized task pattern:

**Phase 3: Inventory System (Tasks 17-24)**
- Batch management (create from supplier purchases)
- Product CRUD with all attributes
- Cost calculation from batch
- Stock level tracking
- Low stock alerts
- Image upload to Supabase Storage

**Phase 4: Production System (Tasks 25-30)**
- Production order creation
- Material selection (frontal + bundles)
- Wig maker assignment
- Cost calculation (materials + wig maker fee + overhead)
- Status workflow
- Inventory deduction on completion

**Phase 5: Sales & Customers (Tasks 31-40)**
- Customer CRUD
- Sale recording with invoice generation
- Product selection from inventory
- Automatic profit calculation
- Invoice/receipt display
- Sales history

**Phase 6: Analytics & Dashboard (Tasks 41-46)**
- Sales trends chart (Recharts)
- Best sellers report
- Profit analysis
- Supplier cost comparison
- Production efficiency metrics
- Enhanced dashboard for owners

**Phase 7: Landing Page (Tasks 47-52)**
- Public layout
- Featured products grid
- Product detail modal
- WhatsApp redirect button
- Instagram link
- Mobile-optimized design

**Phase 8: Polish & PWA (Tasks 53-56)**
- PWA manifest
- Service worker for offline
- App icons
- Final UI polish

---

## Type Definitions

Create `src/types/database.ts` after schema is applied using:
```bash
npx supabase gen types typescript --project-id vqoooewkcuduldgmnfvq > src/types/database.ts
```

---

## Key Implementation Notes

1. **Currency Handling:** Store USD amounts for purchases, NGN for sales. Always store the exchange rate used.

2. **Cost Calculation:** Product cost = (batch total cost in USD × exchange rate) / items in batch + any additional per-item costs

3. **Profit Calculation:** Sale profit = selling price - cost price (snapshot at time of sale)

4. **Stock Management:** Decrement stock on sale, decrement materials on production completion

5. **Mobile-First:** All components designed for touch, bottom nav for mobile, sidebar for desktop

6. **Simple UI:** Large touch targets, clear labels, minimal cognitive load
