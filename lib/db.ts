import "server-only"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getDb() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdmin
}

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн`
  }
  return price.toLocaleString("uk-UA")
}

export interface Admin {
  id: number
  username: string
  name: string
  created_at: Date
}

export interface Client {
  id: number
  name: string
  phone: string
  birth_date?: Date
  additional_phones?: string[]
  notes?: string
  call_status: "called" | "not_called"
  call_notes?: string
  is_hidden: boolean
  waiting_for_showing: boolean
  date_added: Date
  created_at: Date
  updated_at: Date
}

export interface PropertyObject {
  id: number
  address: string
  district?: string
  rooms: number
  area: number
  floor?: number
  total_floors?: number
  price: number
  description?: string
  owner_id?: number
  buyer_id?: number
  status: "available" | "sold" | "has_candidates"
  photos?: string[]
  created_at: Date
  updated_at: Date
  owner?: Client
  buyer?: Client
}

export interface Showing {
  id: number
  object_id: number
  client_id: number
  admin_id?: number
  scheduled_date: Date
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  created_at: Date
  updated_at: Date
  object?: PropertyObject
  client?: Client
  admin?: Admin
}

export interface Transaction {
  id: number
  type: "income" | "expense"
  amount: number
  description?: string
  client_id?: number
  object_id?: number
  admin_id?: number
  transaction_date: Date
  created_at: Date
}
