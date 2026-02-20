import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Device {
  device_id: string;
  created_at: string;
  last_seen: string | null;
  nickname: string | null;
  claimed_by: string | null;
}

/** Fetch unclaimed devices (available to claim) */
export function useUnclaimedDevices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['devices', 'unclaimed'],
    queryFn: async (): Promise<Device[]> => {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .is('claimed_by', null)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return (data || []) as Device[];
    },
    enabled: !!user,
  });
}

/** Fetch devices claimed by current user */
export function useMyDevices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['devices', 'mine', user?.id],
    queryFn: async (): Promise<Device[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('claimed_by', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return (data || []) as Device[];
    },
    enabled: !!user,
  });
}
