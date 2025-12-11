import { useState, useEffect } from 'react';
import { Flame, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import mascotCorgi from '@/assets/mascot-corgi.jpg';

interface StreakDisplayProps {
  currentStreak: number;
  showAnimation: boolean;
  showPerfectWeek: boolean;
  onDismissAnimation: () => void;
  onDismissPerfectWeek: () => void;
}

export const StreakDisplay = ({
  currentStreak,
  showAnimation,
  showPerfectWeek,
  onDismissAnimation,
  onDismissPerfectWeek,
}: StreakDisplayProps) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit' | 'done'>('done');
  const [perfectPhase, setPerfectPhase] = useState<'enter' | 'show' | 'exit' | 'done'>('done');

  useEffect(() => {
    if (showAnimation) {
      setAnimationPhase('enter');
      const showTimer = setTimeout(() => setAnimationPhase('show'), 100);
      const exitTimer = setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setAnimationPhase('done');
          onDismissAnimation();
        }, 500);
      }, 3000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [showAnimation, onDismissAnimation]);

  useEffect(() => {
    if (showPerfectWeek) {
      setPerfectPhase('enter');
      const showTimer = setTimeout(() => setPerfectPhase('show'), 100);
      
      return () => {
        clearTimeout(showTimer);
      };
    }
  }, [showPerfectWeek]);

  const handleDismissPerfect = () => {
    setPerfectPhase('exit');
    setTimeout(() => {
      setPerfectPhase('done');
      onDismissPerfectWeek();
    }, 500);
  };

  return (
    <>
      {/* Streak Badge in Corner */}
      <div className="fixed top-20 right-4 z-40">
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full shadow-lg">
          <Flame className="h-5 w-5 animate-pulse" />
          <span className="font-bold text-lg">{currentStreak}</span>
          <span className="text-sm opacity-90">day streak</span>
        </div>
      </div>

      {/* Streak Increase Animation Overlay */}
      {animationPhase !== 'done' && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500",
            animationPhase === 'enter' && "opacity-0",
            animationPhase === 'show' && "opacity-100",
            animationPhase === 'exit' && "opacity-0"
          )}
          onClick={onDismissAnimation}
        >
          <div
            className={cn(
              "relative flex flex-col items-center transition-all duration-500",
              animationPhase === 'enter' && "scale-50 opacity-0",
              animationPhase === 'show' && "scale-100 opacity-100",
              animationPhase === 'exit' && "scale-50 opacity-0"
            )}
          >
            {/* Mascot Image */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
              <img
                src={mascotCorgi}
                alt="Prime Studios Mascot"
                className="w-48 h-48 object-cover rounded-full border-4 border-yellow-400 shadow-2xl relative z-10 animate-bounce"
              />
              {/* Flame effect around mascot */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Flame className="h-12 w-12 text-orange-500 animate-pulse" />
              </div>
            </div>

            {/* Streak Count */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl">
              <div className="text-center">
                <p className="text-lg font-medium opacity-90">Your streak is now</p>
                <p className="text-6xl font-bold tracking-tight">{currentStreak}</p>
                <p className="text-lg opacity-90">
                  {currentStreak === 1 ? 'day' : 'days'}! 🔥
                </p>
              </div>
            </div>

            {/* Sparkle effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s',
                  }}
                >
                  <span className="text-2xl">✨</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Perfect Week Animation Overlay */}
      {perfectPhase !== 'done' && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500",
            perfectPhase === 'enter' && "opacity-0",
            perfectPhase === 'show' && "opacity-100",
            perfectPhase === 'exit' && "opacity-0"
          )}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent animate-pulse" />
          </div>

          {/* Confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              >
                <span className="text-3xl">
                  {['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🏆'][Math.floor(Math.random() * 7)]}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleDismissPerfect}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <div
            className={cn(
              "relative flex flex-col items-center transition-all duration-700",
              perfectPhase === 'enter' && "scale-0 rotate-180",
              perfectPhase === 'show' && "scale-100 rotate-0",
              perfectPhase === 'exit' && "scale-0 rotate-180"
            )}
          >
            {/* Trophy glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 bg-yellow-400/30 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* Mascot */}
            <div className="relative mb-6 z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-2xl opacity-60" />
              <img
                src={mascotCorgi}
                alt="Prime Studios Mascot"
                className="w-56 h-56 object-cover rounded-full border-8 border-yellow-400 shadow-2xl relative z-10"
                style={{
                  animation: 'bounce 1s ease-in-out infinite, pulse 2s ease-in-out infinite',
                }}
              />
              {/* Crown */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl animate-bounce">
                👑
              </div>
            </div>

            {/* Perfect Week Message */}
            <div className="relative z-10 text-center">
              <h2 
                className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 mb-4"
                style={{
                  textShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
                }}
              >
                PERFECT STREAK!
              </h2>
              <p className="text-2xl text-white/90 mb-2">
                🔥 7 Days in a Row! 🔥
              </p>
              <p className="text-lg text-white/70">
                You're on fire! Keep up the amazing reading habit!
              </p>
            </div>

            {/* Flames at bottom */}
            <div className="flex gap-2 mt-6">
              {[...Array(7)].map((_, i) => (
                <Flame
                  key={i}
                  className="h-10 w-10 text-orange-500"
                  style={{
                    animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
