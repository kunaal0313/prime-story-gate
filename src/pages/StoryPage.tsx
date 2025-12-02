import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface Part {
  id: string;
  title: string;
  order_number: number;
}

interface Story {
  id: string;
  title: string;
  description: string | null;
}

const StoryPage = () => {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const { user, username } = useAuth();
  const { trackActivity } = useActivityTracker();
  const [story, setStory] = useState<Story | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storyId) {
      fetchStoryAndParts();
    }
  }, [storyId]);

  useEffect(() => {
    if (story && user && username) {
      trackActivity('view_story', `Viewed story: ${story.title}`, `/story/${storyId}`);
    }
  }, [story, user, username]);

  const fetchStoryAndParts = async () => {
    try {
      const [storyResult, partsResult] = await Promise.all([
        supabase.from('stories').select('*').eq('id', storyId).single(),
        supabase.from('parts').select('id, title, order_number').eq('story_id', storyId).order('order_number'),
      ]);

      if (storyResult.error) throw storyResult.error;
      if (partsResult.error) throw partsResult.error;

      setStory(storyResult.data);
      setParts(partsResult.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load parts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <FileText className="h-16 w-16 mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img src={logo} alt="Prime Studios" className="h-10 w-10 rounded-full shadow-soft object-cover" />
              <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {story?.title}
              </h1>
            </div>
          </div>
          <Settings />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{story?.title}</h2>
          {story?.description && (
            <p className="text-lg text-muted-foreground">{story.description}</p>
          )}
        </div>

        {parts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No parts available yet</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {parts.map((part) => (
              <Card
                key={part.id}
                onClick={() => navigate(`/part/${part.id}`)}
                className="p-6 cursor-pointer transition-all hover:shadow-card hover:translate-x-2 bg-gradient-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{part.order_number}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{part.title}</h3>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StoryPage;
