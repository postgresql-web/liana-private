import "server-only"
import Database from "better-sqlite3"
import { join } from "path"
import { existsSync, mkdirSync } from "fs"

let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    const dbDir = process.env.DATABASE_DIR || join(process.cwd(), "data")
    const dbPath = process.env.DATABASE_PATH || join(dbDir, "database.sqlite")

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }

    db = new Database(dbPath)

    // Enable WAL mode for better concurrent access
    db.pragma("journal_mode = WAL")

    // Initialize database schema
    initializeSchema()
  }
  return db
}

function initializeSchema() {
  const db = getDb()

  // Create indexes for better performance on CRM tables
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_crm_clients_call_status ON crm_clients(call_status);
    CREATE INDEX IF NOT EXISTS idx_crm_properties_status ON crm_properties(status);
    CREATE INDEX IF NOT EXISTS idx_crm_showings_date ON crm_showings(date);
  `)
}

// Helper function to format price in UAH
export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)} млн`
  }
  return price.toLocaleString("uk-UA")
}

// Types
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
