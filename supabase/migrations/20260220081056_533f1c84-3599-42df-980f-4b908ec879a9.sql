
-- Create devices table for auto-registration
CREATE TABLE public.devices (
  device_id TEXT NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE,
  nickname TEXT,
  claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Anyone can see unclaimed devices (needed for claim flow)
-- Users can see their own claimed devices
CREATE POLICY "Users can view their own or unclaimed devices"
ON public.devices
FOR SELECT
USING (claimed_by IS NULL OR claimed_by = auth.uid());

-- Users can claim unclaimed devices
CREATE POLICY "Users can claim unclaimed devices"
ON public.devices
FOR UPDATE
USING (claimed_by IS NULL OR claimed_by = auth.uid());

-- Service role can upsert devices (from edge function)
CREATE POLICY "Service role can insert devices"
ON public.devices
FOR INSERT
WITH CHECK (true);

-- Index for fast lookup by claimed_by
CREATE INDEX idx_devices_claimed_by ON public.devices(claimed_by);
