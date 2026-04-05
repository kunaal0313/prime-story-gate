import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useStreak } from '@/hooks/useStreak';
import { Card } from '@/components/ui/card';
import { BookOpen, KeyRound, Shield, User, Search, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';
import Settings from '@/components/Settings';
import Advertisement from '@/components/Advertisement';
import { StreakDisplay } from '@/components/StreakDisplay';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface Genre {
  id: string;
  name: string;
  description: string | null;
}

interface StoryResult {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  genre_id: string;
  genres?: { name: string } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { checkAdminStatus, user, isAdmin, username } = useAuth();
  const { trackActivity } = useActivityTracker();
  const { streak, showAnimation, showPerfectWeek, dismissAnimation, dismissPerfectWeek } = useStreak();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showTimePinDialog, setShowTimePinDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showRobotDialog, setShowRobotDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [timePin, setTimePin] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [robotLoading, setRobotLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGenres();
    if (user && username) {
      trackActivity('page_view', 'Visited Dashboard', '/dashboard');
    }
  }, [user, username]);

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
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-code', {
        body: { code: adminPassword }
      });

      if (error || !data?.valid) {
        toast.error('Incorrect password');
        setAdminPassword('');
        return;
      }

      setShowPasswordDialog(false);
      setAdminPassword('');
      setShowTimePinDialog(true);
    } catch (error) {
      toast.error('Failed to verify password');
    }
  };

  const getCurrentTimePin = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    // Convert to 12-hour format
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${formattedMinutes}`;
  };

  const handleTimePinSubmit = () => {
    const currentPin = getCurrentTimePin();
    if (timePin === currentPin) {
      setShowTimePinDialog(false);
      setTimePin('');
      setShowEmailDialog(true);
    } else {
      toast.error('Incorrect time PIN');
      setTimePin('');
    }
  };

  const handleEmailSubmit = async () => {
    if (!adminEmail || !adminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-otp', {
        body: { email: adminEmail }
      });

      if (error) {
        throw error;
      }

      if (data?.dev_otp) {
        // DEV MODE: Show OTP in toast for testing
        toast.success(`OTP sent! (Dev mode: ${data.dev_otp})`);
      } else {
        toast.success('OTP sent to your email');
      }

      setShowEmailDialog(false);
      setShowOtpDialog(true);
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (adminOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin-otp', {
        body: { email: adminEmail, otp: adminOtp }
      });

      if (error || !data?.valid) {
        toast.error('Invalid or expired OTP');
        setAdminOtp('');
        setVerifyingOtp(false);
        return;
      }

      setShowOtpDialog(false);
      setAdminOtp('');
      setShowRobotDialog(true);
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRobotCheck = async () => {
    if (!isRobotChecked) {
      toast.error('Please confirm you are not a robot');
      return;
    }

    if (!user) {
      toast.error('Please log in first');
      setShowRobotDialog(false);
      return;
    }

    setRobotLoading(true);
    
    // Wait exactly 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const { data, error } = await supabase.functions.invoke('grant-admin-role', {
        body: { pin: '2025715' }, // Using the existing pin validation
      });

      if (error || !data?.success) {
        console.error('Error from grant-admin-role function:', error, data);
        toast.error('Failed to grant admin privileges');
        setRobotLoading(false);
        setShowRobotDialog(false);
        return;
      }

      await checkAdminStatus();
      toast.success('Admin access granted! You now have permanent admin privileges.');
      setShowRobotDialog(false);
      setIsRobotChecked(false);
    } catch (error) {
      console.error('Error granting admin access:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setRobotLoading(false);
    }
  };

  const handleGenreClick = (genreId: string) => {
    navigate(`/genre/${genreId}`);
  };

  const filteredGenres = genres.filter(genre =>
    genre.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetAdminFlow = () => {
    setAdminPassword('');
    setTimePin('');
    setAdminEmail('');
    setAdminOtp('');
    setIsRobotChecked(false);
    setRobotLoading(false);
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
      {/* Streak Display */}
      {user && (
        <StreakDisplay
          currentStreak={streak.currentStreak}
          showAnimation={showAnimation}
          showPerfectWeek={showPerfectWeek}
          onDismissAnimation={dismissAnimation}
          onDismissPerfectWeek={dismissPerfectWeek}
        />
      )}
      
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
        <Advertisement />
        {isAdmin ? (
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                User
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <div className="flex flex-col items-center justify-center py-16">
                <Shield className="h-20 w-20 text-primary mb-6" />
                <h2 className="text-3xl font-bold mb-4">Admin Panel</h2>
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

            <TabsContent value="user">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2 text-center">Explore Genres</h2>
                <p className="text-muted-foreground text-center mb-6">
                  Choose a genre to discover amazing stories
                </p>
                
                {/* Search Bar */}
                <div className="max-w-md mx-auto mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search genres..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {filteredGenres.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl text-muted-foreground">
                    {searchQuery ? 'No genres found matching your search' : 'No genres available yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGenres.map((genre) => (
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
          </Tabs>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-center">Explore Genres</h2>
              <p className="text-muted-foreground text-center mb-6">
                Choose a genre to discover amazing stories
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {filteredGenres.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">
                  {searchQuery ? 'No genres found matching your search' : 'No genres available yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGenres.map((genre) => (
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

      {/* Footer - Only show for non-admin users */}
      {!isAdmin && (
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
      )}

      {/* Step 1: Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={(open) => { setShowPasswordDialog(open); if (!open) resetAdminFlow(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Admin Password</DialogTitle>
            <DialogDescription>
              Please enter the admin password to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder="Enter password..."
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Time PIN Dialog */}
      <Dialog open={showTimePinDialog} onOpenChange={(open) => { setShowTimePinDialog(open); if (!open) resetAdminFlow(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Time PIN</DialogTitle>
            <DialogDescription>
              Enter the current time in 12-hour format (e.g., 11:30)
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            placeholder="HH:MM (e.g., 11:30)"
            value={timePin}
            onChange={(e) => setTimePin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTimePinSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimePinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTimePinSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 3: Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={(open) => { setShowEmailDialog(open); if (!open) resetAdminFlow(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Verification
            </DialogTitle>
            <DialogDescription>
              Enter your email address to receive a one-time password (OTP).
            </DialogDescription>
          </DialogHeader>
          <Input
            type="email"
            placeholder="Enter your email..."
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sendingOtp && handleEmailSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailSubmit} disabled={sendingOtp}>
              {sendingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 4: OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={(open) => { setShowOtpDialog(open); if (!open) resetAdminFlow(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to {adminEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={adminOtp} onChange={setAdminOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleOtpSubmit} disabled={verifyingOtp || adminOtp.length !== 6}>
              {verifyingOtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 5: Robot Verification Dialog */}
      <Dialog open={showRobotDialog} onOpenChange={(open) => { setShowRobotDialog(open); if (!open) resetAdminFlow(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final Verification</DialogTitle>
            <DialogDescription>
              Please confirm you are not a robot to complete the verification.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
              <Checkbox
                id="robot-check"
                checked={isRobotChecked}
                onCheckedChange={(checked) => setIsRobotChecked(checked === true)}
                disabled={robotLoading}
              />
              <label
                htmlFor="robot-check"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Are You Robot ???
              </label>
            </div>
          </div>
          {robotLoading && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Verifying your identity...</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRobotDialog(false)} disabled={robotLoading}>
              Cancel
            </Button>
            <Button onClick={handleRobotCheck} disabled={!isRobotChecked || robotLoading}>
              {robotLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;