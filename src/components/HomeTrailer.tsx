import { useState } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import trailer from '@/assets/sapience-trailer-web.mp4.asset.json';
import webTrailer from '@/assets/sapience-trailer.webm.asset.json';
import poster from '@/assets/sapience-trailer-poster.jpg.asset.json';

export default function HomeTrailer() {
  const [failed, setFailed] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['systemSettingsTrailer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_settings').select('trailer_video_url').eq('id', 1).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const customVideoUrl = settings?.trailer_video_url?.trim();

  return <section className="border-b border-border bg-background" aria-labelledby="home-title">
    <div className="container px-5 py-7 md:py-9 flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div>
        <p className="section-label">The Sapience School · Vikasnagar</p>
        <h1 id="home-title" className="font-display text-4xl sm:text-5xl font-bold uppercase mt-3">Sapience <span className="text-primary">eSports.</span></h1>
      </div>
      <div className="md:text-right">
        <p className="font-display font-bold text-lg">Sapience Cup 2026</p>
        <p className="text-warning text-xs mt-2">Under school approval</p>
      </div>
    </div>
    <div className="relative bg-background">
      <video
        key={customVideoUrl || 'default-trailer'}
        className="block w-full aspect-video max-h-[56svh] object-contain"
        autoPlay
        loop
        muted
        controls
        playsInline
        preload="auto"
        poster={poster.url}
        aria-label="Sapience Cup 2026 cinematic trailer"
        onError={() => setFailed(true)}
      >
        {customVideoUrl ? (
          <source src={customVideoUrl} />
        ) : (
          <>
            <source src={trailer.url} type="video/mp4" />
            <source src={webTrailer.url} type="video/webm" />
          </>
        )}
        <a href={customVideoUrl || trailer.url}>Watch the Sapience Cup 2026 trailer</a>
      </video>
      {failed && <p role="alert" className="container px-5 py-3 text-sm text-muted-foreground">The trailer could not load. <a href={trailer.url} className="text-primary underline">Open trailer</a></p>}
    </div>
    <div className="container px-5 py-5 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">BGMI squads. FC Mobile competitors.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild className="rounded-none uppercase text-xs h-10"><a href="#tournaments">Explore tournaments<ArrowUpRight /></a></Button>
        <Button asChild variant="outline" className="rounded-none uppercase text-xs h-10"><Link to="/rules">Official rulebook<ArrowRight /></Link></Button>
      </div>
    </div>
  </section>;
}