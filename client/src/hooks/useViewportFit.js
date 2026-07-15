import { useState, useEffect } from 'react';

// Measures the real viewport and reports how much to scale a fixed-size
// design so it fits entirely on screen, plus whether we're in portrait
// (where the design isn't meant to fit at all — caller should show a
// rotate prompt instead).
export function useViewportFit(designWidth, designHeight, maxScale = 1.5) {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    function handleResize() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isPortrait = viewport.height > viewport.width;
  const scale = Math.min(viewport.width / designWidth, viewport.height / designHeight, maxScale);

  return { scale, isPortrait };
}
