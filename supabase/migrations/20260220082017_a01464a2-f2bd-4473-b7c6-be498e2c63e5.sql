
-- Drop the old permissive SELECT policy that shows unclaimed devices
DROP POLICY IF EXISTS "Users can view their own or unclaimed devices" ON public.devices;

-- New SELECT policy: users can only see their own devices
CREATE POLICY "Users can view their own devices"
ON public.devices
FOR SELECT
USING (claimed_by = auth.uid());
