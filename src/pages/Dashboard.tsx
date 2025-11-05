import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { BookOpen, LogOut, User, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Genre {
  id: string;
  name: string;
  description: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut, checkAdminStatus } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [adminCode, setAdminCode] = useState('');

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
    if (adminCode === 'code-51125') {
      const isAdmin = await checkAdminStatus();
      
      if (isAdmin) {
        navigate('/admin');
      } else {
        toast.error('You do not have admin privileges. Please contact an administrator.');
      }
    } else {
      toast.error('Incorrect code');
    }
    setAdminCode('');
    setShowCodeDialog(false);
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
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.email?.split('@')[0]}
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="default" onClick={() => navigate('/')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
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
            <DialogTitle>Enter Admin Code</DialogTitle>
            <DialogDescription>
              Please enter the secret code to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter code..."
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
    </div>
  );
};

export default Dashboard;
