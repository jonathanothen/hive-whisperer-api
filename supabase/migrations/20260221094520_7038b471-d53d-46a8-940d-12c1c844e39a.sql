
-- Add audio analysis columns to sensor_readings
ALTER TABLE public.sensor_readings
  ADD COLUMN IF NOT EXISTS dbfs real,
  ADD COLUMN IF NOT EXISTS band_hum real,
  ADD COLUMN IF NOT EXISTS band_piping real,
  ADD COLUMN IF NOT EXISTS band_swarm real,
  ADD COLUMN IF NOT EXISTS band_hiss real,
  ADD COLUMN IF NOT EXISTS peak_freq real,
  ADD COLUMN IF NOT EXISTS piping_ratio real;

-- Add comment for documentation
COMMENT ON COLUMN public.sensor_readings.dbfs IS 'dBFS (relative to digital full scale, not calibrated SPL)';
COMMENT ON COLUMN public.sensor_readings.band_hum IS 'Energy in colony hum band (200-300 Hz)';
COMMENT ON COLUMN public.sensor_readings.band_piping IS 'Energy in piping band (300-500 Hz)';
COMMENT ON COLUMN public.sensor_readings.band_swarm IS 'Energy in swarm shift band (450-650 Hz)';
COMMENT ON COLUMN public.sensor_readings.band_hiss IS 'Energy in hiss/noise band (800-3000 Hz)';
COMMENT ON COLUMN public.sensor_readings.peak_freq IS 'Peak frequency in 150-650 Hz range';
COMMENT ON COLUMN public.sensor_readings.piping_ratio IS 'Ratio of piping energy to hum energy';
