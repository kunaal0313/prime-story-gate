import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, BookOpen, Lock } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

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
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
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
        <div className="max-w-md w-full text-center space-y-6">
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
            onClick={signInWithGoogle}
            size="lg"
            className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
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
        </article>
      </main>
    </div>
  );
};

export default PartReader;
