import { useState } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import trailer from '@/assets/sapience-trailer-web.mp4.asset.json';
import webTrailer from '@/assets/sapience-trailer.webm.asset.json';
import poster from '@/assets/sapience-trailer-poster.jpg.asset.json';

function parseVideoUrl(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const ytMatch = trimmed.match(ytRegExp);
  if (ytMatch && ytMatch[2].length === 11) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[2]}`
    };
  }

  const vimeoRegExp = /(?:vimeo)\.com.*(?:videos\/|video\/|channels\/|channels\/\w+\/|)([\d]+)/;
  const vimeoMatch = trimmed.match(vimeoRegExp);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1`
    };
  }

  return { type: 'direct', url: trimmed };
}

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

  const defaultSupabaseVideoUrl = "https://ctwmltatizxoooqkbvvc.supabase.co/storage/v1/object/sign/vault/470c4622-9723-43bf-b511-9d881cda9e37/e79ee9a3-4061-42be-a486-a5b823adcb29-VID-20261020-WA0001.mp4?token=eyJraWQiOiJiMWZlM2RjOC00YjQ5LTRmY2EtYmQ0Yi0zNTRhNTY4MGZlMWYiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJ2YXVsdC80NzBjNDYyMi05NzIzLTQzYmYtYjUxMS05ZDg4MWNkYTllMzcvZTc5ZWU5YTMtNDA2MS00MmJlLWE0ODYtYTViODIzYWRjYjI5LVZJRC0yMDI2MTAyMC1XQTAwMDEubXA0Iiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MjQ5OTIxNSwiZXhwIjoxNzkyNTAyODE1fQ.s3hllpIAexrLRvcOigYCx3w9a9xhYxTfixKM8FiT8lp32B18j4xI0Y9D853hJPrFL7wyL3oSWOCzVnjasPoWng";
  const localVideoUrl = typeof window !== 'undefined' ? localStorage.getItem('sapience_trailer_video_url') : null;
  const rawUrl = settings?.trailer_video_url?.trim() || localVideoUrl?.trim() || defaultSupabaseVideoUrl;
  const parsed = parseVideoUrl(rawUrl);

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
      {parsed && (parsed.type === 'youtube' || parsed.type === 'vimeo') ? (
        <iframe
          key={parsed.embedUrl}
          src={parsed.embedUrl}
          className="block w-full aspect-video max-h-[56svh] object-contain border-0"
          title="Sapience Cup 2026 Trailer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          key={parsed?.url || 'default-trailer'}
          className="block w-full aspect-video max-h-[56svh] object-contain"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={poster.url}
          aria-label="Sapience Cup 2026 cinematic trailer"
          onError={() => setFailed(true)}
        >
          {parsed?.url ? (
            <source src={parsed.url} />
          ) : (
            <>
              <source src={trailer.url} type="video/mp4" />
              <source src={webTrailer.url} type="video/webm" />
            </>
          )}
          <a href={parsed?.url || trailer.url}>Watch the Sapience Cup 2026 trailer</a>
        </video>
      )}
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