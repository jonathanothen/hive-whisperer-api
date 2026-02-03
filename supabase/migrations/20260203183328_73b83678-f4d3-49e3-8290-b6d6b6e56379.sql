-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  sms_notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create apiaries (bigårdar) table
CREATE TABLE public.apiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create hives (bikupor) table
CREATE TABLE public.hives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  apiary_id UUID REFERENCES public.apiaries(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  device_id TEXT UNIQUE,
  notes TEXT,
  status TEXT DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'alarm')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create sensor_readings table for storing all sensor data
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID REFERENCES public.hives(id) ON DELETE CASCADE NOT NULL,
  temperature REAL,
  humidity REAL,
  weight REAL,
  sound_rms REAL,
  swarm_score REAL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster queries on sensor readings
CREATE INDEX idx_sensor_readings_hive_time ON public.sensor_readings(hive_id, recorded_at DESC);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hive_id UUID REFERENCES public.hives(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'alarm')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Apiaries policies
CREATE POLICY "Users can view their own apiaries"
  ON public.apiaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own apiaries"
  ON public.apiaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own apiaries"
  ON public.apiaries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own apiaries"
  ON public.apiaries FOR DELETE
  USING (auth.uid() = user_id);

-- Hives policies
CREATE POLICY "Users can view their own hives"
  ON public.hives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hives"
  ON public.hives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hives"
  ON public.hives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hives"
  ON public.hives FOR DELETE
  USING (auth.uid() = user_id);

-- Sensor readings policies (users can view readings for their hives)
CREATE POLICY "Users can view sensor readings for their hives"
  ON public.sensor_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hives
      WHERE hives.id = sensor_readings.hive_id
      AND hives.user_id = auth.uid()
    )
  );

-- Allow inserting sensor readings via service role (edge function)
CREATE POLICY "Service role can insert sensor readings"
  ON public.sensor_readings FOR INSERT
  WITH CHECK (true);

-- Alerts policies
CREATE POLICY "Users can view their own alerts"
  ON public.alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (true);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_apiaries_updated_at
  BEFORE UPDATE ON public.apiaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hives_updated_at
  BEFORE UPDATE ON public.hives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sensor readings and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hives;