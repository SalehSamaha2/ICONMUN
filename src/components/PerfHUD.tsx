import React, { useEffect, useRef } from 'react';

/**
 * Tiny FPS meter. Only mounted when the URL contains ?perf (e.g. http://localhost:3000/?perf).
 * Shows live FPS, the worst frame time in the last second, and how many frames were
 * slower than 25ms (visible stutter). Lets us measure smoothness with numbers.
 */
export const PerfHUD: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let windowStart = last;
    let frames = 0;
    let worst = 0;
    let slow = 0;
    let totalSlow = 0;

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      frames++;
      if (dt > worst) worst = dt;
      if (dt > 25) {
        slow++;
        totalSlow++;
      }
      if (now - windowStart >= 1000) {
        const fps = Math.round((frames * 1000) / (now - windowStart));
        if (ref.current) {
          ref.current.textContent = `${fps} fps | worst ${worst.toFixed(0)}ms | slow(>25ms) ${slow}/s | total slow ${totalSlow}`;
        }
        frames = 0;
        worst = 0;
        slow = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed bottom-2 left-2 z-[99999] rounded bg-black/80 px-2 py-1 font-mono text-[11px] text-[#7CFC9A]"
    >
      measuring…
    </div>
  );
};
