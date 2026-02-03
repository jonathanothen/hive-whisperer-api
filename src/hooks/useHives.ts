import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Hive, HiveWithLatestReading, Apiary } from '@/types/hive';
import { toast } from 'sonner';

export function useHives() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hives', user?.id],
    queryFn: async (): Promise<HiveWithLatestReading[]> => {
      if (!user) return [];

      // Get hives with apiaries
      const { data: hives, error } = await supabase
        .from('hives')
        .select('*, apiary:apiaries(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get latest reading for each hive
      const hivesWithReadings = await Promise.all(
        (hives || []).map(async (hive) => {
          const { data: readings } = await supabase
            .from('sensor_readings')
            .select('*')
            .eq('hive_id', hive.id)
            .order('recorded_at', { ascending: false })
            .limit(1);

          return {
            ...hive,
            latest_reading: readings?.[0] || undefined,
          } as HiveWithLatestReading;
        })
      );

      return hivesWithReadings;
    },
    enabled: !!user,
  });
}

export function useHive(id: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hive', id],
    queryFn: async (): Promise<HiveWithLatestReading | null> => {
      if (!user) return null;

      const { data: hive, error } = await supabase
        .from('hives')
        .select('*, apiary:apiaries(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const { data: readings } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('hive_id', id)
        .order('recorded_at', { ascending: false })
        .limit(1);

      return {
        ...hive,
        latest_reading: readings?.[0] || undefined,
      } as HiveWithLatestReading;
    },
    enabled: !!user && !!id,
  });
}

export function useApiaries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['apiaries', user?.id],
    queryFn: async (): Promise<Apiary[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('apiaries')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateHive() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      device_id?: string;
      apiary_id?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: hive, error } = await supabase
        .from('hives')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return hive;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success('Bikupa skapad!');
    },
    onError: (error) => {
      toast.error('Kunde inte skapa bikupa', {
        description: error.message,
      });
    },
  });
}

export function useUpdateHive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      device_id?: string | null;
      apiary_id?: string | null;
      notes?: string | null;
    }) => {
      const { data: hive, error } = await supabase
        .from('hives')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return hive;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      queryClient.invalidateQueries({ queryKey: ['hive', variables.id] });
      toast.success('Bikupa uppdaterad!');
    },
    onError: (error) => {
      toast.error('Kunde inte uppdatera bikupa', {
        description: error.message,
      });
    },
  });
}

export function useDeleteHive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success('Bikupa borttagen!');
    },
    onError: (error) => {
      toast.error('Kunde inte ta bort bikupa', {
        description: error.message,
      });
    },
  });
}

export function useCreateApiary() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; location?: string; notes?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: apiary, error } = await supabase
        .from('apiaries')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return apiary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
      toast.success('Bigård skapad!');
    },
    onError: (error) => {
      toast.error('Kunde inte skapa bigård', {
        description: error.message,
      });
    },
  });
}
