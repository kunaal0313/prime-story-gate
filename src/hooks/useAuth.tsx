import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  username: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, dateOfBirth?: Date) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const fetchUsername = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();
    
    // If profile not found, user might have been deleted
    if (error || !data) {
      return null;
    }
    
    setUsername(data?.username || null);
    return data?.username;
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) {
      setIsAdmin(false);
      return false;
    }
    
    setIsAdmin(true);
    return true;
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle token refresh errors (user might have been deleted)
        if (event === 'TOKEN_REFRESHED' && !session) {
          toast.error('Your account has been removed by an administrator.');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setUsername(null);
          window.location.href = '/signup';
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setUsername(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status and fetch username when user logs in
        if (session?.user) {
          setTimeout(async () => {
            const usernameResult = await fetchUsername(session.user.id);
            // If no username found, user might have been deleted
            if (!usernameResult && session?.user) {
              toast.error('Your account has been removed by an administrator.');
              await supabase.auth.signOut();
              window.location.href = '/signup';
              return;
            }
            checkAdminStatus();
          }, 0);
        } else {
          setIsAdmin(false);
          setUsername(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      // Check for refresh token errors
      if (error && error.message?.includes('Refresh Token')) {
        toast.error('Your account has been removed by an administrator.');
        await supabase.auth.signOut();
        setLoading(false);
        window.location.href = '/signup';
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const usernameResult = await fetchUsername(session.user.id);
          if (!usernameResult && session?.user) {
            toast.error('Your account has been removed by an administrator.');
            await supabase.auth.signOut();
            window.location.href = '/signup';
            return;
          }
          checkAdminStatus();
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, dateOfBirth?: Date) => {
    // Check if username already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      return { error: { message: 'Username already taken' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (!error && data.user && dateOfBirth) {
      await supabase.from('profiles').update({
        date_of_birth: format(dateOfBirth, 'yyyy-MM-dd')
      }).eq('user_id', data.user.id);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        username,
        signIn,
        signUp,
        signOut,
        checkAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
