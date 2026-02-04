-- Add last_seen column to hives table for connection tracking
ALTER TABLE public.hives 
ADD COLUMN last_seen timestamp with time zone;