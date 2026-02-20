
-- Create device_commands table for remote calibration
CREATE TABLE public.device_commands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  cmd text NOT NULL,
  known_weight_kg numeric NULL,
  status text NOT NULL DEFAULT 'pending',
  result text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz NULL,
  user_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;

-- Users can view their own commands
CREATE POLICY "Users can view their own commands"
  ON public.device_commands FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own commands
CREATE POLICY "Users can insert their own commands"
  ON public.device_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can read pending commands (for edge function)
CREATE POLICY "Service role can read all commands"
  ON public.device_commands FOR SELECT
  TO service_role
  USING (true);

-- Service role can update commands (for ack from device)
CREATE POLICY "Service role can update commands"
  ON public.device_commands FOR UPDATE
  TO service_role
  USING (true);
