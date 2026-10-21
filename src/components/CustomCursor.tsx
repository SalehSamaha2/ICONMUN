import React, { useEffect, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let animationFrameId: number;
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let isHovered = false;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
        dotRef.current.style.opacity = '1';
      }

      const target = e.target as HTMLElement | null;
      const interactive =
        target &&
        (target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('.interactive') ||
          target.closest('.gold-card') ||
          target.closest('.gold-btn') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A');

      if (interactive && !isHovered) {
        isHovered = true;
        if (ringRef.current) {
          ringRef.current.style.width = '48px';
          ringRef.current.style.height = '48px';
          ringRef.current.style.borderColor = '#F3DFA2';
          ringRef.current.style.backgroundColor = 'rgba(212, 175, 106, 0.12)';
          ringRef.current.style.boxShadow = '0 0 16px rgba(212, 175, 106, 0.4)';
        }
      } else if (!interactive && isHovered) {
        isHovered = false;
        if (ringRef.current) {
          ringRef.current.style.width = '28px';
          ringRef.current.style.height = '28px';
          ringRef.current.style.borderColor = 'rgba(212, 175, 106, 0.6)';
          ringRef.current.style.backgroundColor = 'transparent';
          ringRef.current.style.boxShadow = 'none';
        }
      }
    };

    const handleMouseLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    const animateTrailing = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(animateTrailing);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    animationFrameId = requestAnimationFrame(animateTrailing);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* Outer trailing ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 rounded-full border border-[rgba(212,175,106,0.6)] w-7 h-7 will-change-transform opacity-0 transition-[width,height,border-color,background-color] duration-200"
      />
      {/* Inner sharp gold point */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 rounded-full bg-[#F3DFA2] w-1.5 h-1.5 shadow-[0_0_6px_#F3DFA2] will-change-transform opacity-0"
      />
    </div>
  );
};
