import { useState, useEffect } from 'react';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isPortrait: boolean;
  aspectRatio: number;
  dpr: number;
}

export const useViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;
    const dpr = window.devicePixelRatio || 1;
    
    // Mobile detection: touch support + narrow screen
    const isMobile = 'ontouchstart' in window && width < 1024;
    const isPortrait = height > width;

    return {
      width,
      height,
      isMobile,
      isPortrait,
      aspectRatio,
      dpr,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      const dpr = window.devicePixelRatio || 1;
      const isMobile = 'ontouchstart' in window && width < 1024;
      const isPortrait = height > width;

      setViewport({
        width,
        height,
        isMobile,
        isPortrait,
        aspectRatio,
        dpr,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return viewport;
};
