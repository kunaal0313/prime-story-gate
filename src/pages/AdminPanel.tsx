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
  Pencil,
  Megaphone,
  Users,
  Activity,
  Eye,
  MessageSquare,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const [genres, setGenres] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [advertisements, setAdvertisements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalPageViews: 0,
    totalComments: 0,
  });

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
  const [addType, setAddType] = useState<'genre' | 'story' | 'part' | 'advertisement' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newAd, setNewAd] = useState({
    title: '',
    content: '',
    link: '',
    is_active: true,
    image_url: '',
  });
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [uploadingAdImage, setUploadingAdImage] = useState(false);
  
  // Edit states
  const [editingGenre, setEditingGenre] = useState<any>(null);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [editingAd, setEditingAd] = useState<any>(null);

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
      const [genresData, storiesData, partsData, adsData, profilesData, activityData, commentsData] = await Promise.all([
        supabase.from('genres').select('*').order('name'),
        supabase.from('stories').select('*, genres(name)').order('title'),
        supabase.from('parts').select('*, stories(title)').order('order_number'),
        supabase.from('advertisements').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_activity').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('comments').select('*'),
      ]);

      if (genresData.data) setGenres(genresData.data);
      if (storiesData.data) setStories(storiesData.data);
      if (partsData.data) setParts(partsData.data);
      if (adsData.data) setAdvertisements(adsData.data);
      if (profilesData.data) setUsers(profilesData.data);
      if (activityData.data) setUserActivity(activityData.data);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = activityData.data?.filter(a => new Date(a.created_at) >= today).length || 0;
      const pageViews = activityData.data?.filter(a => a.action === 'page_view').length || 0;

      setUserStats({
        totalUsers: profilesData.data?.length || 0,
        activeToday: new Set(activityData.data?.filter(a => new Date(a.created_at) >= today).map(a => a.user_id)).size,
        totalPageViews: pageViews,
        totalComments: commentsData.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleAddClick = () => {
    setShowAddDialog(true);
  };

  const handleAddTypeSelect = (type: 'genre' | 'story' | 'part' | 'advertisement') => {
    setAddType(type);
    setShowAddDialog(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a PDF file
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        toast.error('File size must be less than 1GB');
        return;
      }
      setUploadedFile(file);
      toast.info('Extracting text from PDF...');
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }
        
        setNewPart({ ...newPart, content: fullText.trim() });
        toast.success('PDF text extracted successfully');
      } catch (error) {
        console.error('Error extracting PDF text:', error);
        toast.error('Failed to extract text from PDF');
        setUploadedFile(null);
      }
    }
  };

  const handleAdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast.error('Image size must be less than 5MB');
        return;
      }
      setAdImageFile(file);
    }
  };

  const uploadAdImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('advertisements')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('advertisements')
      .getPublicUrl(filePath);

    return data.publicUrl;
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

  const updateGenre = async () => {
    if (!editingGenre?.name.trim()) {
      toast.error('Genre name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('genres')
        .update({ name: editingGenre.name, description: editingGenre.description })
        .eq('id', editingGenre.id);
      if (error) throw error;

      toast.success('Genre updated successfully');
      setEditingGenre(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update genre');
    }
  };

  const updateStory = async () => {
    if (!editingStory?.genre_id || !editingStory?.title.trim()) {
      toast.error('Genre and title are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('stories')
        .update({
          genre_id: editingStory.genre_id,
          title: editingStory.title,
          description: editingStory.description,
        })
        .eq('id', editingStory.id);
      if (error) throw error;

      toast.success('Story updated successfully');
      setEditingStory(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update story');
    }
  };

  const updatePart = async () => {
    if (!editingPart?.story_id || !editingPart?.title.trim() || !editingPart?.content.trim()) {
      toast.error('Story, title, and content are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('parts')
        .update({
          story_id: editingPart.story_id,
          title: editingPart.title,
          content: editingPart.content,
          order_number: editingPart.order_number,
        })
        .eq('id', editingPart.id);
      if (error) throw error;

      toast.success('Part updated successfully');
      setEditingPart(null);
      setUploadedFile(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update part');
    }
  };

  const addAdvertisement = async () => {
    if (!newAd.title.trim() || !newAd.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setUploadingAdImage(true);
      let imageUrl = newAd.image_url;

      if (adImageFile) {
        const uploadedUrl = await uploadAdImage(adImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from('advertisements').insert([{
        ...newAd,
        image_url: imageUrl || null,
      }]);
      if (error) throw error;

      toast.success('Advertisement added successfully');
      setNewAd({ title: '', content: '', link: '', is_active: true, image_url: '' });
      setAdImageFile(null);
      setAddType(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add advertisement');
    } finally {
      setUploadingAdImage(false);
    }
  };

  const deleteAdvertisement = async (id: string) => {
    try {
      const { error } = await supabase.from('advertisements').delete().eq('id', id);
      if (error) throw error;

      toast.success('Advertisement deleted successfully');
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete advertisement');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`User "${username}" has been deleted successfully`);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const updateAdvertisement = async () => {
    if (!editingAd?.title.trim() || !editingAd?.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setUploadingAdImage(true);
      let imageUrl = editingAd.image_url;

      if (adImageFile) {
        const uploadedUrl = await uploadAdImage(adImageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('advertisements')
        .update({
          title: editingAd.title,
          content: editingAd.content,
          link: editingAd.link,
          is_active: editingAd.is_active,
          image_url: imageUrl,
        })
        .eq('id', editingAd.id);
      if (error) throw error;

      toast.success('Advertisement updated successfully');
      setEditingAd(null);
      setAdImageFile(null);
      fetchAll();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update advertisement');
    } finally {
      setUploadingAdImage(false);
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
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mx-auto">
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
            <TabsTrigger value="ads">
              <Megaphone className="h-4 w-4 mr-2" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGenre(genre)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteGenre(genre.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingStory(story)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteStory(story.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPart(part)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Advertisements Tab */}
          <TabsContent value="ads" className="space-y-6">
            {advertisements.length === 0 ? (
              <div className="text-center py-16">
                <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No advertisements posted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {advertisements.map((ad) => (
                  <Card key={ad.id} className="p-4 flex items-center justify-between hover:shadow-card transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{ad.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{ad.content}</p>
                        {ad.link && (
                          <a 
                            href={ad.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {ad.link}
                          </a>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Status: {ad.is_active ? '✓ Active' : '✗ Inactive'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAd(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdvertisement(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Users Analytics Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.activeToday}</p>
                    <p className="text-xs text-muted-foreground">Active Today</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalPageViews}</p>
                    <p className="text-xs text-muted-foreground">Page Views</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userStats.totalComments}</p>
                    <p className="text-xs text-muted-foreground">Total Comments</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Users List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Registered Users</h3>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No users registered yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <Card key={u.id} className="p-4 hover:shadow-card transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-hero flex items-center justify-center">
                            <span className="text-white font-bold">
                              {u.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium">{u.username}</h4>
                            <p className="text-sm text-muted-foreground">
                              Joined: {format(new Date(u.created_at), 'MMM d, yyyy')}
                            </p>
                            {u.date_of_birth && (
                              <p className="text-xs text-muted-foreground">
                                DOB: {format(new Date(u.date_of_birth), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(u.user_id, u.username)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {userActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No activity recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userActivity.map((activity) => (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            {activity.action === 'page_view' ? (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            ) : activity.action === 'comment' ? (
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Activity className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{activity.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.action}: {activity.details || activity.page}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
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
              <Button
                onClick={() => handleAddTypeSelect('advertisement')}
                className="h-20 text-lg"
                variant="outline"
              >
                <Megaphone className="h-6 w-6 mr-3" />
                Add Advertisement
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium mb-2 block">Upload PDF Document</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,application/pdf"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile ? uploadedFile.name : 'Click to upload PDF file'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF files only • Max size: 1GB
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

        {/* Edit Genre Dialog */}
        <Dialog open={!!editingGenre} onOpenChange={() => setEditingGenre(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Genre</DialogTitle>
              <DialogDescription>
                Update the genre information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Genre Name</label>
                <Input
                  placeholder="Enter genre name"
                  value={editingGenre?.name || ''}
                  onChange={(e) => setEditingGenre({ ...editingGenre, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  placeholder="Enter description"
                  value={editingGenre?.description || ''}
                  onChange={(e) =>
                    setEditingGenre({ ...editingGenre, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={updateGenre} className="w-full">
                Update Genre
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Story Dialog */}
        <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Story</DialogTitle>
              <DialogDescription>
                Update the story information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Story Title</label>
                <Input
                  placeholder="Enter story title"
                  value={editingStory?.title || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Genre</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={editingStory?.genre_id || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, genre_id: e.target.value })}
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
                  value={editingStory?.description || ''}
                  onChange={(e) =>
                    setEditingStory({ ...editingStory, description: e.target.value })
                  }
                />
              </div>
              <Button onClick={updateStory} className="w-full">
                Update Story
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Part Dialog */}
        <Dialog open={!!editingPart} onOpenChange={() => setEditingPart(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Part</DialogTitle>
              <DialogDescription>
                Update the part content and information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Story</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={editingPart?.story_id || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, story_id: e.target.value })}
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
                  value={editingPart?.title || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Order Number</label>
                <Input
                  type="number"
                  placeholder="Enter order number"
                  value={editingPart?.order_number || 1}
                  onChange={(e) =>
                    setEditingPart({ ...editingPart, order_number: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  placeholder="Enter content"
                  value={editingPart?.content || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, content: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={updatePart} className="w-full">
                Update Part
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Advertisement Dialog */}
        <Dialog open={addType === 'advertisement'} onOpenChange={() => setAddType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Advertisement</DialogTitle>
              <DialogDescription>
                Create a new advertisement to display
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Enter advertisement title"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  placeholder="Enter advertisement content"
                  value={newAd.content}
                  onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Image (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="ad-image-upload"
                    className="hidden"
                    onChange={handleAdImageChange}
                    accept="image/*"
                  />
                  <label htmlFor="ad-image-upload" className="cursor-pointer">
                    <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {adImageFile ? adImageFile.name : 'Click to upload image'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max size: 5MB
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Link (Optional)</label>
                <Input
                  placeholder="Enter link URL (e.g., https://example.com)"
                  value={newAd.link}
                  onChange={(e) => setNewAd({ ...newAd, link: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newAd.is_active}
                  onChange={(e) => setNewAd({ ...newAd, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active (Display to users)
                </label>
              </div>
              <Button onClick={addAdvertisement} className="w-full" disabled={uploadingAdImage}>
                {uploadingAdImage ? 'Uploading...' : 'Create Advertisement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Advertisement Dialog */}
        <Dialog open={!!editingAd} onOpenChange={() => setEditingAd(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Advertisement</DialogTitle>
              <DialogDescription>
                Update the advertisement information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Enter advertisement title"
                  value={editingAd?.title || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <Textarea
                  placeholder="Enter advertisement content"
                  value={editingAd?.content || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, content: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Image (Optional)</label>
                {editingAd?.image_url && (
                  <div className="mb-2">
                    <img src={editingAd.image_url} alt="Current ad image" className="w-full h-24 object-cover rounded-md" />
                  </div>
                )}
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="edit-ad-image-upload"
                    className="hidden"
                    onChange={handleAdImageChange}
                    accept="image/*"
                  />
                  <label htmlFor="edit-ad-image-upload" className="cursor-pointer">
                    <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {adImageFile ? adImageFile.name : 'Click to upload new image'}
                    </p>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Link (Optional)</label>
                <Input
                  placeholder="Enter link URL (e.g., https://example.com)"
                  value={editingAd?.link || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, link: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editingAd?.is_active || false}
                  onChange={(e) => setEditingAd({ ...editingAd, is_active: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="edit_is_active" className="text-sm font-medium">
                  Active (Display to users)
                </label>
              </div>
              <Button onClick={updateAdvertisement} className="w-full" disabled={uploadingAdImage}>
                {uploadingAdImage ? 'Uploading...' : 'Update Advertisement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPanel;
