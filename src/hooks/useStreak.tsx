import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isPerfectWeek: boolean;
  streakIncreased: boolean;
}

const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

const fetchStreakViaApi = async (userId: string): Promise<UserStreak | null> => {
  const session = await supabase.auth.getSession();
  const result = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_streaks?user_id=eq.${userId}&select=*`,
    {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${session.data.session?.access_token}`,
      },
    }
  );
  const rows = await result.json() as UserStreak[];
  return rows?.[0] || null;
};

const updateStreakViaApi = async (userId: string, updates: Partial<UserStreak>) => {
  const session = await supabase.auth.getSession();
  await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_streaks?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${session.data.session?.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(updates),
    }
  );
};

const insertStreakViaApi = async (userId: string, streakData: Partial<UserStreak>) => {
  const session = await supabase.auth.getSession();
  await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_streaks`,
    {
      method: 'POST',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${session.data.session?.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ ...streakData, user_id: userId }),
    }
  );
};

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    isPerfectWeek: false,
    streakIncreased: false,
  });
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showPerfectWeek, setShowPerfectWeek] = useState(false);
  const hasRecordedRef = useRef(false);

  const processStreakData = useCallback(async (data: UserStreak, userId: string) => {
    const today = getToday();
    const lastActivity = data.last_activity_date;
    
    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        await updateStreakViaApi(userId, { 
          current_streak: 0, 
          last_activity_date: null 
        });
        
        setStreak({
          currentStreak: 0,
          longestStreak: data.longest_streak,
          lastActivityDate: null,
          isPerfectWeek: false,
          streakIncreased: false,
        });
      } else {
        setStreak({
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastActivityDate: data.last_activity_date,
          isPerfectWeek: data.current_streak >= 7,
          streakIncreased: false,
        });
      }
    } else {
      setStreak({
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        lastActivityDate: data.last_activity_date,
        isPerfectWeek: data.current_streak >= 7,
        streakIncreased: false,
      });
    }
  }, []);

  const fetchStreak = useCallback(async () => {
    if (!user) return;
    
    try {
      const streakData = await fetchStreakViaApi(user.id);
      if (streakData) {
        await processStreakData(streakData, user.id);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  }, [user, processStreakData]);

  const recordActivity = useCallback(async () => {
    if (!user || hasRecordedRef.current) return;
    
    const today = getToday();
    
    try {
      const existing = await fetchStreakViaApi(user.id);

      if (!existing) {
        hasRecordedRef.current = true;
        await insertStreakViaApi(user.id, {
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
        });

        setStreak({
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          isPerfectWeek: false,
          streakIncreased: true,
        });
        setShowAnimation(true);
      } else {
        const lastActivity = existing.last_activity_date;
        
        if (lastActivity === today) {
          hasRecordedRef.current = true;
          return;
        }

        hasRecordedRef.current = true;
        const lastDate = lastActivity ? new Date(lastActivity) : null;
        const todayDate = new Date(today);
        
        let newStreak = 1;
        let streakIncreased = false;
        
        if (lastDate) {
          const diffTime = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak = existing.current_streak + 1;
            streakIncreased = true;
          } else if (diffDays > 1) {
            newStreak = 1;
            streakIncreased = true;
          }
        } else {
          streakIncreased = true;
        }

        const newLongest = Math.max(newStreak, existing.longest_streak);
        const isPerfectWeek = newStreak >= 7;
        const wasPerfectWeek = existing.current_streak >= 7;

        await updateStreakViaApi(user.id, {
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
        });

        setStreak({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActivityDate: today,
          isPerfectWeek,
          streakIncreased,
        });

        if (streakIncreased) {
          setShowAnimation(true);
        }
        
        if (isPerfectWeek && !wasPerfectWeek && newStreak === 7) {
          setTimeout(() => setShowPerfectWeek(true), 1500);
        }
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }, [user]);

  const dismissAnimation = useCallback(() => {
    setShowAnimation(false);
  }, []);

  const dismissPerfectWeek = useCallback(() => {
    setShowPerfectWeek(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
  }, [user, fetchStreak]);

  useEffect(() => {
    if (user && !loading) {
      recordActivity();
    }
  }, [user, loading, recordActivity]);

  return {
    streak,
    loading,
    showAnimation,
    showPerfectWeek,
    recordActivity,
    dismissAnimation,
    dismissPerfectWeek,
  };
};
