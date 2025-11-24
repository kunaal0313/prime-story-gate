import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.jpg';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, loading, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // Redirect to admin panel if user is admin, otherwise to dashboard
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message || 'Failed to sign in');
      setSubmitting(false);
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">
            <BookOpen className="h-16 w-16 mx-auto text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <img
            src={logo}
            alt="Prime Studios"
            className="mx-auto h-32 w-32 rounded-full shadow-card object-cover"
          />
          <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to continue your reading journey
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-card p-8 rounded-lg shadow-card border border-border">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Log In'
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            Continue as Guest
          </Button>

          <div className="text-center pt-4">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="text-primary font-semibold hover:underline"
              >
                Create one now!!
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
