import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

interface Story {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
}

interface Genre {
  id: string;
  name: string;
}

const GenrePage = () => {
  const navigate = useNavigate();
  const { genreId } = useParams<{ genreId: string }>();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (genreId) {
      fetchGenreAndStories();
    }
  }, [genreId]);

  const fetchGenreAndStories = async () => {
    try {
      const [genreResult, storiesResult] = await Promise.all([
        supabase.from('genres').select('*').eq('id', genreId).single(),
        supabase.from('stories').select('*').eq('genre_id', genreId).order('title'),
      ]);

      if (genreResult.error) throw genreResult.error;
      if (storiesResult.error) throw storiesResult.error;

      setGenre(genreResult.data);
      setStories(storiesResult.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-center">
          <BookOpen className="h-16 w-16 mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Prime Studios" className="h-10 w-10 rounded-full shadow-soft object-cover" />
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              {genre?.name}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Stories in {genre?.name}</h2>
          <p className="text-muted-foreground">Select a story to start reading</p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No stories available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card
                key={story.id}
                onClick={() => navigate(`/story/${story.id}`)}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-card hover:scale-105"
              >
                <div className="aspect-video bg-gradient-hero flex items-center justify-center">
                  {story.cover_image ? (
                    <img
                      src={story.cover_image}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-16 w-16 text-white" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{story.title}</h3>
                  {story.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {story.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default GenrePage;
