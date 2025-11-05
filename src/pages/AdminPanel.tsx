import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  FolderOpen,
} from 'lucide-react';
import logo from '@/assets/logo.jpg';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [genres, setGenres] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);

  // Form states
  const [newGenre, setNewGenre] = useState({ name: '', description: '' });
  const [newStory, setNewStory] = useState({
    genre_id: '',
    title: '',
    description: '',
  });
  const [newPart, setNewPart] = useState({
    story_id: '',
    title: '',
    content: '',
    order_number: 1,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
    } else if (isAdmin) {
      fetchAll();
    }
  }, [isAdmin, loading, navigate]);

  const fetchAll = async () => {
    try {
      const [genresData, storiesData, partsData] = await Promise.all([
        supabase.from('genres').select('*').order('name'),
        supabase.from('stories').select('*, genres(name)').order('title'),
        supabase.from('parts').select('*, stories(title)').order('order_number'),
      ]);

      if (genresData.data) setGenres(genresData.data);
      if (storiesData.data) setStories(storiesData.data);
      if (partsData.data) setParts(partsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const addGenre = async () => {
    if (!newGenre.name.trim()) {
      toast.error('Genre name is required');
      return;
    }

    try {
      const { error } = await supabase.from('genres').insert([newGenre]);
      if (error) throw error;

      toast.success('Genre added successfully');
      setNewGenre({ name: '', description: '' });
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add genre');
    }
  };

  const deleteGenre = async (id: string) => {
    try {
      const { error } = await supabase.from('genres').delete().eq('id', id);
      if (error) throw error;

      toast.success('Genre deleted successfully');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete genre');
    }
  };

  const addStory = async () => {
    if (!newStory.genre_id || !newStory.title.trim()) {
      toast.error('Genre and title are required');
      return;
    }

    try {
      const { error } = await supabase.from('stories').insert([newStory]);
      if (error) throw error;

      toast.success('Story added successfully');
      setNewStory({ genre_id: '', title: '', description: '' });
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add story');
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;

      toast.success('Story deleted successfully');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete story');
    }
  };

  const addPart = async () => {
    if (!newPart.story_id || !newPart.title.trim() || !newPart.content.trim()) {
      toast.error('Story, title, and content are required');
      return;
    }

    try {
      const { error } = await supabase.from('parts').insert([newPart]);
      if (error) throw error;

      toast.success('Part added successfully');
      setNewPart({ story_id: '', title: '', content: '', order_number: 1 });
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add part');
    }
  };

  const deletePart = async (id: string) => {
    try {
      const { error } = await supabase.from('parts').delete().eq('id', id);
      if (error) throw error;

      toast.success('Part deleted successfully');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete part');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Prime Studios" className="h-10 w-10 rounded-full shadow-soft object-cover" />
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="genres" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="genres">
              <FolderOpen className="h-4 w-4 mr-2" />
              Genres
            </TabsTrigger>
            <TabsTrigger value="stories">
              <BookOpen className="h-4 w-4 mr-2" />
              Stories
            </TabsTrigger>
            <TabsTrigger value="parts">
              <FileText className="h-4 w-4 mr-2" />
              Parts
            </TabsTrigger>
          </TabsList>

          {/* Genres Tab */}
          <TabsContent value="genres" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Genre</h3>
              <div className="space-y-4">
                <Input
                  placeholder="Genre Name"
                  value={newGenre.name}
                  onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newGenre.description}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, description: e.target.value })
                  }
                />
                <Button onClick={addGenre} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Genre
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Genres</h3>
              {genres.map((genre) => (
                <Card key={genre.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{genre.name}</h4>
                    {genre.description && (
                      <p className="text-sm text-muted-foreground">{genre.description}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteGenre(genre.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Story</h3>
              <div className="space-y-4">
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={newStory.genre_id}
                  onChange={(e) => setNewStory({ ...newStory, genre_id: e.target.value })}
                >
                  <option value="">Select Genre</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Story Title"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newStory.description}
                  onChange={(e) =>
                    setNewStory({ ...newStory, description: e.target.value })
                  }
                />
                <Button onClick={addStory} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Story
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Stories</h3>
              {stories.map((story) => (
                <Card key={story.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{story.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Genre: {story.genres?.name}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteStory(story.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Parts Tab */}
          <TabsContent value="parts" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Part</h3>
              <div className="space-y-4">
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={newPart.story_id}
                  onChange={(e) => setNewPart({ ...newPart, story_id: e.target.value })}
                >
                  <option value="">Select Story</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Part Title"
                  value={newPart.title}
                  onChange={(e) => setNewPart({ ...newPart, title: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Order Number"
                  value={newPart.order_number}
                  onChange={(e) =>
                    setNewPart({ ...newPart, order_number: parseInt(e.target.value) })
                  }
                />
                <Textarea
                  placeholder="Part Content"
                  value={newPart.content}
                  onChange={(e) => setNewPart({ ...newPart, content: e.target.value })}
                  rows={10}
                />
                <Button onClick={addPart} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Parts</h3>
              {parts.map((part) => (
                <Card key={part.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">
                      Part {part.order_number}: {part.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Story: {part.stories?.title}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePart(part.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;
