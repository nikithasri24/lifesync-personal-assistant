-- Trip Planner Tables
-- Stores multi-country trip plans with visa requirements and costs

-- Trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip destinations (countries in the trip)
CREATE TABLE IF NOT EXISTS trip_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  arrival_date DATE,
  departure_date DATE,
  days_staying INTEGER,
  order_index INTEGER NOT NULL, -- Order of visit
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visa requirements for trip (computed/cached data)
CREATE TABLE IF NOT EXISTS trip_visa_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES trip_destinations(id) ON DELETE CASCADE,
  visa_type VARCHAR(50) NOT NULL, -- visa-free, visa-on-arrival, e-visa, visa-required, etc.
  days_allowed INTEGER,
  estimated_cost DECIMAL(10, 2),
  processing_days INTEGER,
  access_via VARCHAR(50) DEFAULT 'passport', -- passport or visa name (e.g., 'US H1B')
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_visa_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips
CREATE POLICY "Users can view their own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
  ON trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
  ON trips FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trip_destinations
CREATE POLICY "Users can view destinations of their trips"
  ON trip_destinations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add destinations to their trips"
  ON trip_destinations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update destinations of their trips"
  ON trip_destinations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete destinations from their trips"
  ON trip_destinations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_destinations.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- RLS Policies for trip_visa_requirements
CREATE POLICY "Users can view visa requirements of their trips"
  ON trip_visa_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_visa_requirements.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add visa requirements to their trips"
  ON trip_visa_requirements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_visa_requirements.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update visa requirements of their trips"
  ON trip_visa_requirements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_visa_requirements.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete visa requirements from their trips"
  ON trip_visa_requirements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_visa_requirements.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trip_destinations_trip_id ON trip_destinations(trip_id);
CREATE INDEX idx_trip_destinations_order ON trip_destinations(trip_id, order_index);
CREATE INDEX idx_trip_visa_requirements_trip_id ON trip_visa_requirements(trip_id);
CREATE INDEX idx_trip_visa_requirements_destination_id ON trip_visa_requirements(destination_id);
