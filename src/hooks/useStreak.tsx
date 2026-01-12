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
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
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
  const isProcessingRef = useRef(false);

  const fetchAndProcessStreak = useCallback(async () => {
    if (!user || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    const today = getToday();
    const yesterday = getYesterday();
    
    try {
      // Fetch existing streak data
      const { data: existingStreak, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching streak:', fetchError);
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }

      if (!existingStreak) {
        // No streak record exists - create one
        if (!hasRecordedRef.current) {
          hasRecordedRef.current = true;
          
          const { error: insertError } = await supabase
            .from('user_streaks')
            .insert({
              user_id: user.id,
              current_streak: 1,
              longest_streak: 1,
              last_activity_date: today,
            });

          if (insertError) {
            console.error('Error creating streak:', insertError);
          } else {
            setStreak({
              currentStreak: 1,
              longestStreak: 1,
              lastActivityDate: today,
              isPerfectWeek: false,
              streakIncreased: true,
            });
            setShowAnimation(true);
          }
        }
      } else {
        const lastActivity = existingStreak.last_activity_date;
        
        // Already visited today - just show current streak
        if (lastActivity === today) {
          setStreak({
            currentStreak: existingStreak.current_streak,
            longestStreak: existingStreak.longest_streak,
            lastActivityDate: lastActivity,
            isPerfectWeek: existingStreak.current_streak >= 7,
            streakIncreased: false,
          });
        } else if (lastActivity === yesterday) {
          // Visited yesterday - increment streak
          if (!hasRecordedRef.current) {
            hasRecordedRef.current = true;
            
            const newStreak = existingStreak.current_streak + 1;
            const newLongest = Math.max(newStreak, existingStreak.longest_streak);
            const isPerfectWeek = newStreak >= 7;
            const wasNotPerfectWeek = existingStreak.current_streak < 7;

            const { error: updateError } = await supabase
              .from('user_streaks')
              .update({
                current_streak: newStreak,
                longest_streak: newLongest,
                last_activity_date: today,
              })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating streak:', updateError);
            } else {
              setStreak({
                currentStreak: newStreak,
                longestStreak: newLongest,
                lastActivityDate: today,
                isPerfectWeek,
                streakIncreased: true,
              });
              setShowAnimation(true);
              
              // Show perfect week celebration when reaching exactly 7 days
              if (isPerfectWeek && wasNotPerfectWeek && newStreak === 7) {
                setTimeout(() => setShowPerfectWeek(true), 2000);
              }
            }
          }
        } else {
          // Missed a day or more - reset streak
          if (!hasRecordedRef.current) {
            hasRecordedRef.current = true;
            
            const { error: updateError } = await supabase
              .from('user_streaks')
              .update({
                current_streak: 1,
                last_activity_date: today,
              })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error resetting streak:', updateError);
            } else {
              setStreak({
                currentStreak: 1,
                longestStreak: existingStreak.longest_streak,
                lastActivityDate: today,
                isPerfectWeek: false,
                streakIncreased: true,
              });
              setShowAnimation(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streak processing:', error);
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
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
      hasRecordedRef.current = false;
      isProcessingRef.current = false;
      fetchAndProcessStreak();
    }
  }, [user, fetchAndProcessStreak]);

  return {
    streak,
    loading,
    showAnimation,
    showPerfectWeek,
    dismissAnimation,
    dismissPerfectWeek,
  };
};