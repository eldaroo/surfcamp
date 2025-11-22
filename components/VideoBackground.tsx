"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  src: string;
  poster?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
}

export default function VideoBackground({
  src,
  poster,
  className = "",
  overlay = false,
  overlayOpacity = 0.4,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Only load video on desktop and after component mount
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      // Delay video loading to not block initial render
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoad || !videoRef.current) return;

    const video = videoRef.current;

    const handleCanPlay = () => {
      setIsLoaded(true);
      video.play().catch(err => {
        // Silently handle autoplay errors
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    return () => video.removeEventListener('canplay', handleCanPlay);
  }, [shouldLoad]);

  if (!shouldLoad) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className={`absolute inset-0 bg-slate-950 ${className}`}
          style={{
            backgroundImage: poster ? `url(${poster})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {overlay && (
          <div
            className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/30 to-slate-950/50"
            style={{ opacity: overlayOpacity }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/30 to-slate-950/50"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Fallback poster image while video loads */}
      {!isLoaded && poster && (
        <div
          className="absolute inset-0 bg-slate-950"
          style={{
            backgroundImage: `url(${poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
}
