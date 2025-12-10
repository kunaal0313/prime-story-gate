import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Ad {
  id: string;
  title: string;
  content: string;
  link: string | null;
  image_url: string | null;
}

const Advertisement = () => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchRandomAd();
  }, []);

  const fetchRandomAd = async () => {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        // Select a random ad
        const randomAd = data[Math.floor(Math.random() * data.length)];
        setAd(randomAd);
      }
    } catch (error) {
      console.error('Error fetching advertisement:', error);
    }
  };

  if (!ad || !isVisible) return null;

  const handleAdClick = () => {
    if (ad.link) {
      // Ensure link has protocol
      let url = ad.link;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card 
      className="fixed right-8 top-1/2 -translate-y-1/2 w-72 p-4 shadow-lg bg-gradient-card border-2 border-primary/20 z-50 animate-in slide-in-from-right duration-500"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="space-y-3 mt-6">
        {ad.image_url && (
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full h-32 object-cover rounded-md"
          />
        )}
        <h3 className="font-bold text-lg">{ad.title}</h3>
        <p className="text-sm text-muted-foreground">{ad.content}</p>
        {ad.link && (
          <Button
            onClick={handleAdClick}
            className="w-full bg-gradient-hero"
            size="sm"
          >
            Learn More
          </Button>
        )}
      </div>
    </Card>
  );
};

export default Advertisement;
