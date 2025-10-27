import "server-only"
import { getDb } from "./db"

export interface Property {
  id: string
  address: string
  type: "apartment" | "house"
  status: "available" | "reserved" | "sold"
  price: number
  area: number
  rooms?: number
  floor?: number
  totalFloors?: number
  owner?: string
  ownerPhone?: string
  description?: string
  inventory?: string
  hasFurniture: boolean
  photos?: string[]
  notes?: string
  tags?: string[]
  createdAt: string
}

export interface Client {
  id: string
  name: string
  phone: string
  callStatus: "not_called" | "reached" | "not_reached"
  type: "buyer" | "both"
  status: "active" | "inactive" | "completed"
  budget?: string
  notes?: string
  createdAt: string
}

export interface Showing {
  id: string
  objectId: string
  date: string
  time: string
  notes?: string
  createdAt: string
}

export interface User {
  username: string
  password: string
  fullName: string
  email: string
  role: "admin" | "user"
}

export interface AdminAction {
  id: string
  adminUsername: string
  action: string
  details: string
  ipAddress: string
  timestamp: string
}

function hashPassword(password: string): string {
  const bcrypt = require("bcrypt")
  const saltRounds = 10
  return bcrypt.hashSync(password + (process.env.PASSWORD_SALT || "salt"), saltRounds)
}

function verifyPassword(password: string, hash: string): boolean {
  const bcrypt = require("bcrypt")
  try {
    return bcrypt.compareSync(password + (process.env.PASSWORD_SALT || "salt"), hash)
  } catch {
    return false
  }
}

class DataStore {
  constructor() {
    this.initializeDatabase()
  }

  private async initializeDatabase() {
    const db = getDb()

    const { data: users, error } = await db
      .from("crm_users")
      .select("username")
      .limit(1)

    if (!error && (!users || users.length === 0)) {
      await db.from("crm_users").insert([
        { username: "admin", password: hashPassword("admin123"), full_name: "Адміністратор", email: "admin@liana.ua", role: "admin" },
        { username: "Elena", password: hashPassword("12345"), full_name: "Олена", email: "elena@liana.ua", role: "admin" },
        { username: "Anna", password: hashPassword("09876"), full_name: "Анна", email: "anna@liana.ua", role: "admin" }
      ])
    }
  }

  async clearAllData() {
    const db = getDb()
    await db.from("crm_properties").delete().neq("id", "")
    await db.from("crm_clients").delete().neq("id", "")
    await db.from("crm_showings").delete().neq("id", "")
    await db.from("crm_admin_actions").delete().neq("id", "")
  }

  async logAdminAction(action: Omit<AdminAction, "id" | "timestamp">) {
    const db = getDb()
    const newAction: AdminAction = {
      ...action,
      id: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    await db.from("crm_admin_actions").insert({
      id: newAction.id,
      admin_username: newAction.adminUsername,
      action: newAction.action,
      details: newAction.details,
      ip_address: newAction.ipAddress,
      timestamp: newAction.timestamp,
    })

    return newAction
  }

  async getAdminActions(username?: string) {
    const db = getDb()
    let query = db.from("crm_admin_actions").select("*").order("timestamp", { ascending: false })

    if (username) {
      query = query.eq("admin_username", username)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map(row => ({
      id: row.id,
      adminUsername: row.admin_username,
      action: row.action,
      details: row.details,
      ipAddress: row.ip_address,
      timestamp: row.timestamp,
    }))
  }

  async getAllAdminUsernames() {
    const db = getDb()
    const { data, error } = await db
      .from("crm_admin_actions")
      .select("admin_username")

    if (error || !data) return []

    const uniqueUsernames = [...new Set(data.map(row => row.admin_username))]
    return uniqueUsernames
  }

  async getProperties(): Promise<Property[]> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_properties")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((row: any) => ({
      id: row.id,
      address: row.address,
      type: row.type,
      status: row.status,
      price: Number(row.price),
      area: Number(row.area),
      rooms: row.rooms,
      floor: row.floor,
      totalFloors: row.total_floors,
      owner: row.owner,
      ownerPhone: row.owner_phone,
      description: row.description,
      inventory: row.inventory,
      hasFurniture: row.has_furniture,
      photos: row.photos || [],
      mainPhotoIndex: row.main_photo_index || 0,
      notes: row.notes,
      tags: row.tags || [],
      createdAt: row.created_at,
    }))
  }

  async getProperty(id: string): Promise<Property | null> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_properties")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      address: data.address,
      type: data.type,
      status: data.status,
      price: Number(data.price),
      area: Number(data.area),
      rooms: data.rooms,
      floor: data.floor,
      totalFloors: data.total_floors,
      owner: data.owner,
      ownerPhone: data.owner_phone,
      description: data.description,
      inventory: data.inventory,
      hasFurniture: data.has_furniture,
      photos: data.photos || [],
      mainPhotoIndex: data.main_photo_index || 0,
      notes: data.notes,
      tags: data.tags || [],
      createdAt: data.created_at,
    } as Property
  }

  async createProperty(property: Omit<Property, "createdAt">) {
    const db = getDb()
    const newProperty = {
      ...property,
      createdAt: new Date().toISOString(),
    }

    const { error } = await db.from("crm_properties").insert({
      id: newProperty.id,
      address: newProperty.address,
      type: newProperty.type,
      status: newProperty.status,
      price: newProperty.price,
      area: newProperty.area,
      rooms: newProperty.rooms,
      floor: newProperty.floor,
      total_floors: newProperty.totalFloors,
      owner: newProperty.owner,
      owner_phone: newProperty.ownerPhone,
      description: newProperty.description,
      inventory: newProperty.inventory,
      has_furniture: newProperty.hasFurniture,
      photos: newProperty.photos || [],
      main_photo_index: (newProperty as any).mainPhotoIndex || 0,
      notes: newProperty.notes,
      tags: newProperty.tags || [],
      created_at: newProperty.createdAt,
    })

    if (error) throw error

    return newProperty
  }

  async updateProperty(id: string, updates: Partial<Property>) {
    const db = getDb()
    const property = await this.getProperty(id)
    if (!property) return null

    const updated = { ...property, ...updates }

    const { error } = await db
      .from("crm_properties")
      .update({
        address: updated.address,
        type: updated.type,
        status: updated.status,
        price: updated.price,
        area: updated.area,
        rooms: updated.rooms,
        floor: updated.floor,
        total_floors: updated.totalFloors,
        owner: updated.owner,
        owner_phone: updated.ownerPhone,
        description: updated.description,
        inventory: updated.inventory,
        has_furniture: updated.hasFurniture,
        photos: updated.photos || [],
        main_photo_index: (updated as any).mainPhotoIndex || 0,
        notes: updated.notes,
        tags: updated.tags || [],
      })
      .eq("id", id)

    if (error) throw error

    return this.getProperty(id)
  }

  async deleteProperty(id: string) {
    const db = getDb()

    await db.from("crm_showings").delete().eq("object_id", id)

    const { error } = await db.from("crm_properties").delete().eq("id", id)

    return !error
  }

  async getClients(): Promise<Client[]> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_clients")
      .select("*")
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      callStatus: row.call_status,
      type: row.type,
      status: row.status,
      budget: row.budget,
      notes: row.notes,
      createdAt: row.created_at,
    }))
  }

  async getClient(id: string): Promise<Client | null> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_clients")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      callStatus: data.call_status,
      type: data.type,
      status: data.status,
      budget: data.budget,
      notes: data.notes,
      createdAt: data.created_at,
    }
  }

  async createClient(client: Omit<Client, "id" | "createdAt">) {
    const db = getDb()
    const newClient = {
      ...client,
      id: `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    }

    const { error } = await db.from("crm_clients").insert({
      id: newClient.id,
      name: newClient.name,
      phone: newClient.phone,
      call_status: newClient.callStatus,
      type: newClient.type,
      status: newClient.status,
      budget: newClient.budget,
      notes: newClient.notes,
      created_at: newClient.createdAt,
    })

    if (error) throw error

    return newClient
  }

  async updateClient(id: string, updates: Partial<Client>) {
    const db = getDb()
    const client = await this.getClient(id)
    if (!client) return null

    const updated = { ...client, ...updates }

    const { error } = await db
      .from("crm_clients")
      .update({
        name: updated.name,
        phone: updated.phone,
        call_status: updated.callStatus,
        type: updated.type,
        status: updated.status,
        budget: updated.budget,
        notes: updated.notes,
      })
      .eq("id", id)

    if (error) throw error

    return this.getClient(id)
  }

  async deleteClient(id: string) {
    const db = getDb()
    const { error } = await db.from("crm_clients").delete().eq("id", id)
    return !error
  }

  async getShowings(): Promise<Showing[]> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_showings")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false })

    if (error || !data) return []

    return data.map((row: any) => ({
      id: row.id,
      objectId: row.object_id,
      date: row.date,
      time: row.time,
      notes: row.notes,
      createdAt: row.created_at,
    }))
  }

  async getShowing(id: string): Promise<Showing | null> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_showings")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) return null

    return {
      id: data.id,
      objectId: data.object_id,
      date: data.date,
      time: data.time,
      notes: data.notes,
      createdAt: data.created_at,
    }
  }

  async getShowingsByObject(objectId: string): Promise<Showing[]> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_showings")
      .select("*")
      .eq("object_id", objectId)
      .order("date", { ascending: false })
      .order("time", { ascending: false })

    if (error || !data) return []

    return data.map((row: any) => ({
      id: row.id,
      objectId: row.object_id,
      date: row.date,
      time: row.time,
      notes: row.notes,
      createdAt: row.created_at,
    }))
  }

  async createShowing(showing: Omit<Showing, "id" | "createdAt">) {
    const db = getDb()
    const newShowing = {
      ...showing,
      id: `SH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    }

    const { error } = await db.from("crm_showings").insert({
      id: newShowing.id,
      object_id: newShowing.objectId,
      date: newShowing.date,
      time: newShowing.time,
      notes: newShowing.notes,
      created_at: newShowing.createdAt,
    })

    if (error) throw error

    return newShowing
  }

  async updateShowing(id: string, updates: Partial<Showing>) {
    const db = getDb()
    const showing = await this.getShowing(id)
    if (!showing) return null

    const updated = { ...showing, ...updates }

    const { error } = await db
      .from("crm_showings")
      .update({
        object_id: updated.objectId,
        date: updated.date,
        time: updated.time,
        notes: updated.notes,
      })
      .eq("id", id)

    if (error) throw error

    return this.getShowing(id)
  }

  async deleteShowing(id: string) {
    const db = getDb()
    const { error } = await db.from("crm_showings").delete().eq("id", id)
    return !error
  }

  async getUser(username: string): Promise<User | null> {
    const db = getDb()
    const { data, error } = await db
      .from("crm_users")
      .select("*")
      .eq("username", username)
      .maybeSingle()

    if (error || !data) return null

    return {
      username: data.username,
      password: data.password,
      fullName: data.full_name,
      email: data.email,
      role: data.role || "user",
    }
  }

  async verifyUserPassword(username: string, password: string): Promise<boolean> {
    const user = await this.getUser(username)
    if (!user) return false
    return verifyPassword(password, user.password)
  }

  async updateUser(username: string, updates: Partial<User>) {
    const db = getDb()
    const user = await this.getUser(username)
    if (!user) return null

    const updated = { ...user, ...updates }

    if (updates.password) {
      updated.password = hashPassword(updates.password)
    }

    const { error } = await db
      .from("crm_users")
      .update({
        password: updated.password,
        full_name: updated.fullName,
        email: updated.email,
        role: updated.role,
      })
      .eq("username", username)

    if (error) throw error

    return this.getUser(username)
  }
}

let dataStore: DataStore | null = null

export function getDataStore() {
  if (!dataStore) {
    try {
      dataStore = new DataStore()
    } catch (error) {
      console.error("[v0] Failed to initialize data store:", error)
      throw error
    }
  }
  return dataStore
}
