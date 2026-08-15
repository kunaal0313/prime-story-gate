import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable/index';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SocialAuthButtonsProps {
  disabled?: boolean;
}

const SocialAuthButtons = ({ disabled }: SocialAuthButtonsProps) => {
  const [pending, setPending] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'microsoft') => {
    setPending(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error(result.error.message || 'Sign in failed');
      setPending(null);
      return;
    }

    if (result.redirected) return;
    // Session set — auth listener handles navigation
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={disabled || pending !== null}
        onClick={() => handleSignIn('google')}
      >
        {pending === 'google' ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z" />
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={disabled || pending !== null}
        onClick={() => handleSignIn('microsoft')}
      >
        {pending === 'microsoft' ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" aria-hidden="true">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#7FBA00" d="M12 1h10v10H12z" />
            <path fill="#00A4EF" d="M1 12h10v10H1z" />
            <path fill="#FFB900" d="M12 12h10v10H12z" />
          </svg>
        )}
        Continue with Microsoft
      </Button>
    </div>
  );
};

export default SocialAuthButtons;
