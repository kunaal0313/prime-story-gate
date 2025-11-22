import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { BookOpen, KeyRound, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Genre {
  id: string;
  name: string;
  description: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { checkAdminStatus, user, isAdmin } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminPin, setAdminPin] = useState('');

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('name');

      if (error) throw error;
      setGenres(data || []);
    } catch (error) {
      console.error('Error fetching genres:', error);
      toast.error('Failed to load genres');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorClick = () => {
    setShowCodeDialog(true);
  };

  const handleCodeSubmit = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-code', {
        body: { code: adminCode }
      });

      if (error || !data?.valid) {
        toast.error('Incorrect secret code');
        setAdminCode('');
        return;
      }

      setShowCodeDialog(false);
      setAdminCode('');
      setShowPinDialog(true);
    } catch (error) {
      toast.error('Failed to verify code');
    }
  };

  const handlePinSubmit = async () => {
    if (adminPin === '2025715') {
      if (!user) {
        toast.error('Please log in first');
        setAdminPin('');
        setShowPinDialog(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('grant-admin-role', {
          body: { pin: adminPin },
        });

        if (error || !data?.success) {
          console.error('Error from grant-admin-role function:', error, data);
          toast.error('Failed to grant admin privileges');
          setAdminPin('');
          setShowPinDialog(false);
          return;
        }

        await checkAdminStatus();
        toast.success('Admin access granted! You now have permanent admin privileges.');
        setShowPinDialog(false);
        setAdminPin('');
      } catch (error) {
        console.error('Error in PIN verification:', error);
        toast.error('An error occurred. Please try again.');
      }
    } else {
      toast.error('Incorrect PIN');
    }
    setAdminPin('');
    setShowPinDialog(false);
  };

  const handleGenreClick = (genreId: string) => {
    navigate(`/genre/${genreId}`);
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Prime Studios" className="h-12 w-12 rounded-full shadow-soft object-cover" />
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Prime Studios
            </h1>
          </div>
          <Settings />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {isAdmin ? (
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User View
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin Panel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-2">Explore Genres</h2>
                <p className="text-muted-foreground">
                  Choose a genre to discover amazing stories
                </p>
              </div>

              {genres.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">No genres available yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {genres.map((genre) => (
                    <Card
                      key={genre.id}
                      onClick={() => handleGenreClick(genre.id)}
                      className="p-6 cursor-pointer transition-all hover:shadow-card hover:scale-105 bg-gradient-card"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold">{genre.name}</h3>
                      </div>
                      {genre.description && (
                        <p className="text-sm text-muted-foreground">{genre.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="admin">
              <div className="flex flex-col items-center justify-center py-16">
                <Shield className="h-20 w-20 text-primary mb-6" />
                <h2 className="text-3xl font-bold mb-4">Admin Panel Access</h2>
                <p className="text-muted-foreground mb-8 text-center max-w-md">
                  Manage genres, stories, and parts from the admin panel
                </p>
                <Button
                  onClick={() => navigate('/admin')}
                  size="lg"
                  className="shadow-lg bg-gradient-hero"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Open Admin Panel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-2">Explore Genres</h2>
              <p className="text-muted-foreground">
                Choose a genre to discover amazing stories
              </p>
            </div>

            {genres.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No genres available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {genres.map((genre) => (
                  <Card
                    key={genre.id}
                    onClick={() => handleGenreClick(genre.id)}
                    className="p-6 cursor-pointer transition-all hover:shadow-card hover:scale-105 bg-gradient-card"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-hero flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold">{genre.name}</h3>
                    </div>
                    {genre.description && (
                      <p className="text-sm text-muted-foreground">{genre.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={handleAuthorClick}
            className="gap-2 hover:text-primary"
          >
            <KeyRound className="h-4 w-4" />
            Author?
          </Button>
        </div>
      </footer>

      {/* Admin Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Secret Code</DialogTitle>
            <DialogDescription>
              Please enter the secret code to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter secret code..."
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCodeSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Admin PIN</DialogTitle>
            <DialogDescription>
              Please enter your admin PIN to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter PIN..."
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePinSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
