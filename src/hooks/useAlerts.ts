import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Alert } from '@/types/hive';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          
          const alert = payload.new as Alert;
          if (alert.alert_type === 'critical') {
            toast.error('🚨 KRITISK VARNING!', {
              description: alert.message,
              duration: 15000,
            });
          } else if (alert.alert_type === 'alarm') {
            toast.error('🚨 Larm!', {
              description: alert.message,
              duration: 10000,
            });
          } else {
            toast.warning('⚠️ Varning', {
              description: alert.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async (): Promise<Alert[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('alerts')
        .select('*, hive:hives(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        alert_type: item.alert_type as 'warning' | 'alarm' | 'critical',
      }));
    },
    enabled: !!user,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ acknowledged: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error) => {
      toast.error('Kunde inte markera varning som läst', {
        description: error.message,
      });
    },
  });
}
