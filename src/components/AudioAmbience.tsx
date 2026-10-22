import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export const AudioAmbience: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    oscillators: OscillatorNode[];
    gainNode: GainNode | null;
  }>({
    oscillators: [],
    gainNode: null,
  });

  const toggleSound = () => {
    if (isPlaying) {
      // Fade out
      if (nodesRef.current.gainNode && audioCtxRef.current) {
        nodesRef.current.gainNode.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
        setTimeout(() => {
          nodesRef.current.oscillators.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {
              // ignore
            }
          });
          nodesRef.current.oscillators = [];
          setIsPlaying(false);
        }, 500);
      } else {
        setIsPlaying(false);
      }
    } else {
      // Start ambient synth
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.5); // Soft, subtle ambient level
        masterGain.connect(ctx.destination);
        nodesRef.current.gainNode = masterGain;

        // Warm low drone chords (C2, G2, D3, G3) with subtle detuning
        const freqs = [65.41, 98.0, 146.83, 196.0];
        const oscs: OscillatorNode[] = [];

        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          // Subtle detune for rich analog luxury warmth
          osc.detune.setValueAtTime((idx - 1.5) * 6, ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, ctx.currentTime);

          if (panner) {
            panner.pan.value = (idx - 1.5) * 0.4;
            osc.connect(filter);
            filter.connect(panner);
            panner.connect(masterGain);
          } else {
            osc.connect(filter);
            filter.connect(masterGain);
          }

          osc.start();
          oscs.push(osc);
        });

        nodesRef.current.oscillators = oscs;
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio ambience initiation error:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      nodesRef.current.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      aria-label={isPlaying ? 'Mute diplomatic ambient tone' : 'Play diplomatic ambient tone'}
      title={isPlaying ? 'Mute Ambience' : 'Play Ambience'}
      className="fixed z-40 flex items-center justify-center gap-2 rounded-full border border-[#D4AF6A]/30 bg-[#0A0A0A]/85 px-4 py-2.5 min-h-[44px] min-w-[44px] text-xs font-medium text-[#F3DFA2] shadow-lg backdrop-blur-md transition-all hover:border-[#D4AF6A] hover:bg-[#121212] hover:shadow-[0_0_15px_rgba(212,175,106,0.3)] active:scale-95 cursor-pointer"
      style={{
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
        right: 'max(1.25rem, env(safe-area-inset-right, 0px))',
      }}
    >
      {isPlaying ? (
        <>
          <Volume2 className="h-4 w-4 animate-pulse text-[#D4AF6A]" />
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#D4AF6A]">Ambience On</span>
        </>
      ) : (
        <>
          <VolumeX className="h-4 w-4 text-[#A89D8A]" />
          <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[#A89D8A]">Ambience Off</span>
        </>
      )}
    </button>
  );
};
