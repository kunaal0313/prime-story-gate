import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  FolderOpen,
  Upload,
} from 'lucide-react';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';

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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addType, setAddType] = useState<'genre' | 'story' | 'part' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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

  const handleAddClick = () => {
    setShowAddDialog(true);
  };

  const handleAddTypeSelect = (type: 'genre' | 'story' | 'part') => {
    setAddType(type);
    setShowAddDialog(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast.error('File size must be less than 1GB');
        return;
      }
      setUploadedFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setNewPart({ ...newPart, content });
      };
      reader.readAsText(file);
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
      setAddType(null);
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
      setAddType(null);
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
      setUploadedFile(null);
      setAddType(null);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <Settings />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        <Tabs defaultValue="genres" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
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
            {genres.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No genres posted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {genres.map((genre) => (
                  <Card key={genre.id} className="p-4 flex items-center justify-between hover:shadow-card transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{genre.name}</h4>
                        {genre.description && (
                          <p className="text-sm text-muted-foreground">{genre.description}</p>
                        )}
                      </div>
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
            )}
          </TabsContent>

          {/* Stories Tab */}
          <TabsContent value="stories" className="space-y-6">
            {stories.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No stories posted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stories.map((story) => (
                  <Card key={story.id} className="p-4 flex items-center justify-between hover:shadow-card transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{story.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Genre: {story.genres?.name}
                        </p>
                      </div>
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
            )}
          </TabsContent>

          {/* Parts Tab */}
          <TabsContent value="parts" className="space-y-6">
            {parts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No parts posted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {parts.map((part) => (
                  <Card key={part.id} className="p-4 flex items-center justify-between hover:shadow-card transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Part {part.order_number}: {part.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Story: {part.stories?.title}
                        </p>
                      </div>
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
            )}
          </TabsContent>
        </Tabs>

        {/* Floating Action Button */}
        <Button
          onClick={handleAddClick}
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-card hover:shadow-lg transition-all bg-gradient-hero"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Add Type Selection Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What would you like to add?</DialogTitle>
              <DialogDescription>
                Choose what type of content you want to create
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Button
                onClick={() => handleAddTypeSelect('genre')}
                className="h-20 text-lg"
                variant="outline"
              >
                <FolderOpen className="h-6 w-6 mr-3" />
                Add Genre
              </Button>
              <Button
                onClick={() => handleAddTypeSelect('story')}
                className="h-20 text-lg"
                variant="outline"
              >
                <BookOpen className="h-6 w-6 mr-3" />
                Add Story
              </Button>
              <Button
                onClick={() => handleAddTypeSelect('part')}
                className="h-20 text-lg"
                variant="outline"
              >
                <FileText className="h-6 w-6 mr-3" />
                Add Part
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Genre Dialog */}
        <Dialog open={addType === 'genre'} onOpenChange={() => setAddType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Genre</DialogTitle>
              <DialogDescription>
                Create a new genre for your stories
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Genre Name</label>
                <Input
                  placeholder="Enter genre name"
                  value={newGenre.name}
                  onChange={(e) => setNewGenre({ ...newGenre, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Enter description"
                  value={newGenre.description}
                  onChange={(e) =>
                    setNewGenre({ ...newGenre, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={addGenre} className="w-full">
                Create Genre
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Story Dialog */}
        <Dialog open={addType === 'story'} onOpenChange={() => setAddType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Story</DialogTitle>
              <DialogDescription>
                Create a new story and assign it to a genre
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Story Title</label>
                <Input
                  placeholder="Enter story title"
                  value={newStory.title}
                  onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
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
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Enter description"
                  value={newStory.description}
                  onChange={(e) =>
                    setNewStory({ ...newStory, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={addStory} className="w-full">
                Create Story
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Part Dialog */}
        <Dialog open={addType === 'part'} onOpenChange={() => setAddType(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
              <DialogDescription>
                Upload a document or write content for a new part
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Story</label>
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
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Part Title</label>
                <Input
                  placeholder="Enter part title"
                  value={newPart.title}
                  onChange={(e) => setNewPart({ ...newPart, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order Number</label>
                <Input
                  type="number"
                  placeholder="Enter order number"
                  value={newPart.order_number}
                  onChange={(e) =>
                    setNewPart({ ...newPart, order_number: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Upload Document</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".txt,.doc,.docx,.pdf"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum file size: 1GB
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Or Write Content</label>
                <Textarea
                  placeholder="Enter content"
                  value={newPart.content}
                  onChange={(e) => setNewPart({ ...newPart, content: e.target.value })}
                  rows={10}
                />
              </div>
              <Button onClick={addPart} className="w-full">
                Create Part
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPanel;
