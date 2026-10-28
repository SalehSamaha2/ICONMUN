# Autoplay & Scroll-Modulated Background Video Playback

Resolves the video playback blockage caused by browser iframe autoplay security policies. By configuring native `autoPlay`, `muted`, `loop`, and `playsInline`, the video immediately gains browser playback clearance on load, dynamically modulates speed with scroll velocity during user navigation, and cleanly pauses when scrolling stops.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during the interactive clarification phase:

- **Confirmed Playback Clearance**: Enable native HTML5 `autoPlay` alongside `muted` and `playsInline`. Browsers inside iframes reject programmatic `play()` from scroll events unless the video was initialized with `autoPlay`.
- **Confirmed Speed Modulation**: Scrolling down/up dynamically modulates playback speed ($1.0\times$–$2.2\times$) based on scroll velocity.
- **Confirmed Idle Behavior**: Automatically pauses after a 350ms settling window when scrolling stops, holding the frame cleanly.
- **Video Source**: `https://res.cloudinary.com/edtur3gp/video/upload/v1793171466/Create_3D_mask_animation_8bf7b23b.mp4`.

---

## 1. Overview & Core Concept

- **The Problem**: Web browsers in sandbox/iframe environments reject programmatic `.play()` invocations originating from synthetic or non-gesture scroll events, resulting in an unhandled promise rejection and leaving the video permanently paused.
- **The Solution**:
  1. Add native HTML attributes `autoPlay`, `muted`, `playsInline`, and `loop`. This satisfies the browser's Autoplay Policy specification, granting instant permission.
  2. While the user is actively scrolling, the playback rate dynamically adjusts to match scroll intensity.
  3. When the user stops scrolling, a smooth debounce timer calls `video.pause()`. When the user scrolls again, `video.play()` resumes without browser blockage.

---

## 2. User Experience & Visual Design

### Playback State Machine

```
[ Page Load ] ────────────► Video autoplays muted immediately (no frozen frame)
                                └─ 3D mask animation is moving smoothly

[ User Scrolls ] ─────────► Scroll velocity modulates playback speed
                                └─ Fast scroll: accelerates up to 2.0x
                                └─ Steady scroll: normal 1.0x

[ User Stops Scrolling ] ─► 350ms settling timer pauses video
                                └─ Frame rests in focus while reading

[ User Resumes Scroll ] ──► Video unpauses smoothly and continues playing
```

### Visual Styling

- Full-screen fixed background (`fixed inset-0 pointer-events-none z-0`).
- Atmospheric edge vignette (`radial-gradient`) blending into `#050505` obsidian paper.
- Ambient floating gold dust particles (`GoldDustCanvas`) layered softly on top.
- High-legibility frosted glass cards (`backdrop-blur-md bg-[#050505]/65 border border-gold/25`) in front (`z-10`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native `autoPlay` Attribute Initialization**:
  - *Chosen Approach*: Supply `autoPlay` on the `<video>` element directly in JSX.
  - *Why*: Guaranteed by W3C specification to play muted media without requiring click gestures.
- **Decision 2: 350ms Pause Settle Window**:
  - *Chosen Approach*: A 350ms window before pausing.
  - *Why*: Accommodates smooth trackpad and mouse wheel deceleration curves without jerky micro-stuttering.

---

## 4. Technical Architecture & Component Implementation

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  (Lenis Smooth Scroll + Global GSAP ScrollTrigger Sync)      │
└───────────────┬─────────────────────────────┬───────────────┘
                │
                ▼ Velocity & Active Scroll Updates
    ┌─────────────────────────────────────────┐
    │ BackgroundVideoScrubber (Fixed z-0)     │
    │                                         │
    │ • autoPlay + muted + playsInline        │
    │ • Modulate speed: 1.0x - 2.2x           │
    │ • On scroll idle: video.pause()         │
    │ • On scroll resume: video.play()        │
    │ • Vignette & Gold Dust ambient layers   │
    └─────────────────────────────────────────┘
```

### Implementation Steps

1. **Update `BackgroundVideoScrubber.tsx`**:
   - Set `<video autoPlay muted loop playsInline preload="auto" src={VIDEO_URL} />`.
   - Implement velocity-based playback rate modulation.
   - Implement 350ms debounce pause on idle and immediate unpause on scroll.
2. **Verify**:
   - Run compilation and linting tests.
