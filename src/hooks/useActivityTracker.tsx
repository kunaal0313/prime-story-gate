import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useActivityTracker = () => {
  const { user, username } = useAuth();

  const trackActivity = async (action: string, details?: string, page?: string) => {
    if (!user || !username) return;
    
    try {
      await supabase.from('user_activity').insert({
        user_id: user.id,
        username: username,
        action,
        details,
        page: page || window.location.pathname,
      });
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  };

  // Track page views automatically
  useEffect(() => {
    if (user && username) {
      trackActivity('page_view', `Visited ${window.location.pathname}`, window.location.pathname);
    }
  }, [user, username, window.location.pathname]);

  return { trackActivity };
};
