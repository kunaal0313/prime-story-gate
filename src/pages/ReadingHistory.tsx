import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Clock, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import { format } from 'date-fns';

interface ReadingHistoryItem {
  id: string;
  part_id: string;
  story_id: string;
  read_at: string;
  parts: {
    title: string;
    order_number: number;
  } | null;
  stories: {
    title: string;
    cover_image: string | null;
  } | null;
}

const ReadingHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchHistory();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('*, parts(title, order_number), stories(title, cover_image)')
        .eq('user_id', user!.id)
        .order('read_at', { ascending: false });

      if (error) throw error;
      setHistory((data as any) || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load reading history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', user!.id);

      if (error) throw error;
      setHistory([]);
      toast.success('Reading history cleared');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to clear history');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from history');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to remove item');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <BookOpen className="h-16 w-16 mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-lg shadow-card border border-border">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-gradient-hero flex items-center justify-center">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold">Sign In Required</h2>
          <p className="text-lg text-muted-foreground">You must be signed in to view reading history</p>
          <Button onClick={() => navigate('/')} size="lg" className="w-full bg-gradient-hero hover:opacity-90 transition-opacity">
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Prime Studios" className="h-10 w-10 rounded-full shadow-soft object-cover" />
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Reading History
              </h1>
            </div>
          </div>
          <Settings />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {history.length > 0 && (
            <div className="flex justify-end mb-6">
              <Button variant="destructive" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All History
              </Button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">No Reading History</h2>
              <p className="text-muted-foreground">Start reading stories to see your history here</p>
              <Button onClick={() => navigate('/dashboard')}>Browse Stories</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/part/${item.part_id}`)}
                >
                  {item.stories?.cover_image ? (
                    <img
                      src={item.stories.cover_image}
                      alt={item.stories?.title || ''}
                      className="h-16 w-12 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-12 rounded bg-gradient-hero flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{item.stories?.title || 'Unknown Story'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      Part {item.parts?.order_number}: {item.parts?.title || 'Unknown Part'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(new Date(item.read_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReadingHistory;
