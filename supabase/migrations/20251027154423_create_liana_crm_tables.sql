/*
  # Create Liana CRM Database Schema

  ## Overview
  Complete database schema for the Liana CRM real estate management system.
  This migration creates all necessary tables with proper constraints, indexes, and Row Level Security.

  ## Tables Created

  ### 1. crm_users
  Stores user accounts for the CRM system.
  - `username` (text, primary key): Unique username for login
  - `password` (text): Hashed password
  - `full_name` (text): User's full display name
  - `email` (text): User's email address
  - `role` (text): User role ('admin' or 'user')
  - `created_at` (timestamptz): Account creation timestamp

  ### 2. crm_properties
  Stores real estate property listings.
  - `id` (text, primary key): Unique property identifier
  - `address` (text): Full property address
  - `type` (text): Property type ('apartment' or 'house')
  - `status` (text): Current status ('available', 'reserved', 'sold')
  - `price` (numeric): Property price in UAH
  - `area` (numeric): Property area in square meters
  - `rooms` (integer): Number of rooms
  - `floor` (integer): Floor number
  - `total_floors` (integer): Total floors in building
  - `owner` (text): Owner name
  - `owner_phone` (text): Owner phone number
  - `description` (text): Property description
  - `inventory` (text): Property inventory details
  - `has_furniture` (boolean): Whether property has furniture
  - `photos` (jsonb): Array of photo URLs
  - `main_photo_index` (integer): Index of main photo in array
  - `notes` (text): Additional notes
  - `tags` (jsonb): Array of tags
  - `created_at` (timestamptz): Record creation timestamp

  ### 3. crm_clients
  Stores client information (buyers and sellers).
  - `id` (text, primary key): Unique client identifier
  - `name` (text): Client name
  - `phone` (text): Client phone number
  - `call_status` (text): Call status ('not_called', 'reached', 'not_reached')
  - `type` (text): Client type ('buyer', 'both')
  - `status` (text): Client status ('active', 'inactive', 'completed')
  - `budget` (text): Client budget range
  - `notes` (text): Additional notes about client
  - `created_at` (timestamptz): Record creation timestamp

  ### 4. crm_showings
  Stores property showing appointments.
  - `id` (text, primary key): Unique showing identifier
  - `object_id` (text, foreign key): Reference to property
  - `date` (text): Showing date (ISO format)
  - `time` (text): Showing time
  - `notes` (text): Showing notes
  - `created_at` (timestamptz): Record creation timestamp

  ### 5. crm_admin_actions
  Logs administrative actions for audit trail.
  - `id` (text, primary key): Unique action identifier
  - `admin_username` (text): Username who performed action
  - `action` (text): Action type
  - `details` (text): Action details
  - `ip_address` (text): IP address of user
  - `timestamp` (timestamptz): Action timestamp

  ## Security (Row Level Security)
  
  All tables have RLS enabled with policies that:
  - Allow authenticated users to read all data
  - Allow authenticated users to insert, update, and delete data
  - These are administrative tables meant for CRM staff only

  ## Indexes
  
  Performance indexes created on:
  - Property status for filtering
  - Client status and call status for filtering
  - Showing dates for calendar queries
  - Admin action usernames and timestamps for audit logs

  ## Important Notes
  
  1. This migration uses TEXT for IDs instead of SERIAL/UUID to maintain compatibility with existing data
  2. JSONB is used for arrays (photos, tags) to enable flexible queries
  3. All timestamps use timestamptz for proper timezone handling
  4. CHECK constraints ensure data integrity for enum-like fields
*/

-- Create crm_users table
CREATE TABLE IF NOT EXISTS crm_users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create crm_properties table
CREATE TABLE IF NOT EXISTS crm_properties (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  type TEXT CHECK(type IN ('apartment', 'house')) NOT NULL,
  status TEXT CHECK(status IN ('available', 'reserved', 'sold')) NOT NULL,
  price NUMERIC NOT NULL,
  area NUMERIC NOT NULL,
  rooms INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  owner TEXT,
  owner_phone TEXT,
  description TEXT,
  inventory TEXT,
  has_furniture BOOLEAN DEFAULT false,
  photos JSONB DEFAULT '[]'::jsonb,
  main_photo_index INTEGER DEFAULT 0,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create crm_clients table
CREATE TABLE IF NOT EXISTS crm_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  call_status TEXT CHECK(call_status IN ('not_called', 'reached', 'not_reached')) DEFAULT 'not_called',
  type TEXT CHECK(type IN ('buyer', 'both')) DEFAULT 'buyer',
  status TEXT CHECK(status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
  budget TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create crm_showings table
CREATE TABLE IF NOT EXISTS crm_showings (
  id TEXT PRIMARY KEY,
  object_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_object FOREIGN KEY (object_id) REFERENCES crm_properties(id) ON DELETE CASCADE
);

-- Create crm_admin_actions table
CREATE TABLE IF NOT EXISTS crm_admin_actions (
  id TEXT PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_properties_status ON crm_properties(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_call_status ON crm_clients(call_status);
CREATE INDEX IF NOT EXISTS idx_crm_showings_object_id ON crm_showings(object_id);
CREATE INDEX IF NOT EXISTS idx_crm_showings_date ON crm_showings(date);
CREATE INDEX IF NOT EXISTS idx_crm_admin_actions_username ON crm_admin_actions(admin_username);
CREATE INDEX IF NOT EXISTS idx_crm_admin_actions_timestamp ON crm_admin_actions(timestamp);

-- Enable Row Level Security on all tables
ALTER TABLE crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_users
CREATE POLICY "Authenticated users can read users"
  ON crm_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON crm_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON crm_users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete users"
  ON crm_users FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for crm_properties
CREATE POLICY "Authenticated users can read properties"
  ON crm_properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert properties"
  ON crm_properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update properties"
  ON crm_properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete properties"
  ON crm_properties FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for crm_clients
CREATE POLICY "Authenticated users can read clients"
  ON crm_clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON crm_clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON crm_clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON crm_clients FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for crm_showings
CREATE POLICY "Authenticated users can read showings"
  ON crm_showings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert showings"
  ON crm_showings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update showings"
  ON crm_showings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete showings"
  ON crm_showings FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for crm_admin_actions
CREATE POLICY "Authenticated users can read admin actions"
  ON crm_admin_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert admin actions"
  ON crm_admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update admin actions"
  ON crm_admin_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete admin actions"
  ON crm_admin_actions FOR DELETE
  TO authenticated
  USING (true);
