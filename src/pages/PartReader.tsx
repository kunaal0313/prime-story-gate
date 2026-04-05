import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { ArrowLeft, BookOpen, Lock } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import CommentSection from '@/components/CommentSection';

interface Part {
  id: string;
  title: string;
  content: string;
  order_number: number;
  story_id: string;
}

const PartReader = () => {
  const navigate = useNavigate();
  const { partId } = useParams<{ partId: string }>();
  const { user, username, loading: authLoading } = useAuth();
  const { trackActivity } = useActivityTracker();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && partId) {
      if (user) {
        fetchPart();
      } else {
        setLoading(false);
      }
    }
  }, [partId, user, authLoading]);

  useEffect(() => {
    if (part && user && username) {
      trackActivity('read_part', `Read part: ${part.title}`, `/part/${partId}`);
      // Log to reading history
      supabase
        .from('reading_history')
        .upsert(
          { user_id: user.id, part_id: part.id, story_id: part.story_id, read_at: new Date().toISOString() },
          { onConflict: 'user_id,part_id' }
        )
        .then(({ error }) => {
          if (error) console.error('Failed to log reading history:', error);
        });
    }
  }, [part, user, username]);

  const fetchPart = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('id', partId)
        .single();

      if (error) throw error;
      setPart(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load part');
    } finally {
      setLoading(false);
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

  // Show login requirement if user is not signed in
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
          <p className="text-lg text-muted-foreground">
            You must be signed in to read story content
          </p>
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => part?.story_id && navigate(`/story/${part.story_id}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Prime Studios" className="h-10 w-10 rounded-full shadow-soft object-cover" />
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {part?.title}
              </h1>
            </div>
          </div>
          <Settings />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-card p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 rounded-full bg-gradient-hero flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{part?.order_number}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{part?.title}</h1>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {part?.content}
              </div>
            </div>
          </div>

          {/* Comment Section */}
          {part && <CommentSection partId={part.id} />}
        </article>
      </main>
    </div>
  );
};

export default PartReader;
