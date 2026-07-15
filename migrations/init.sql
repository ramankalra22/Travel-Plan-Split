-- ============================================================
-- Travel Itinerary Planner with Splitwise Feature
-- Database Migration: init.sql
-- Run via: npm run db:init  OR paste into Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  cover_image TEXT,
  currency    VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- ============================================================
-- TRIP MEMBERS TABLE
-- Members can be registered users or just named participants
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255),
  role        VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trip_id, email)
);

-- ============================================================
-- DESTINATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS destinations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  country     VARCHAR(100),
  city        VARCHAR(100),
  latitude    DECIMAL(10, 7),
  longitude   DECIMAL(10, 7),
  arrival_date    DATE,
  departure_date  DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACTIVITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id  UUID REFERENCES destinations(id) ON DELETE SET NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  activity_date   DATE,
  start_time      TIME,
  end_time        TIME,
  location        VARCHAR(255),
  cost            DECIMAL(12, 2) DEFAULT 0,
  currency        VARCHAR(10) DEFAULT 'USD',
  booking_ref     VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES TABLE
-- Tracks who paid for what in a trip
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  paid_by         UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  amount          DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency        VARCHAR(10) NOT NULL DEFAULT 'USD',
  category        VARCHAR(50) DEFAULT 'general' CHECK (category IN ('food', 'transport', 'accommodation', 'activity', 'shopping', 'general', 'other')),
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  split_type      VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSE PARTICIPANTS TABLE
-- Tracks how each expense is split among trip members
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_participants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id      UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id       UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
  share_amount    DECIMAL(12, 2) NOT NULL CHECK (share_amount >= 0),
  share_percent   DECIMAL(5, 2),
  is_settled      BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at      TIMESTAMPTZ,
  UNIQUE (expense_id, member_id)
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_trips_created_by       ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id   ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id   ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_trip_id   ON destinations(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id     ON activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id       ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by       ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_member_id  ON expense_participants(member_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to trips
DROP TRIGGER IF EXISTS set_trips_updated_at ON trips;
CREATE TRIGGER set_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to expenses
DROP TRIGGER IF EXISTS set_expenses_updated_at ON expenses;
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Travel Planner schema initialized successfully!';
END $$;
