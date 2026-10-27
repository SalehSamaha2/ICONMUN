# Stretch Background Video Full Page & Instant Upward Reverse

Stretch the background unmasking animation across the entire length of the site so the video progress spans from 0% at the Hero all the way to 100% at the Footer, and enable instant reverse video activation on the first upward scroll motion without delay or drift.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in Phase 1:
>
> - **Confirmed Full-Page Progression**: The video will no longer run ahead in real-time and end prematurely at the Secretariat. Instead, the animation is strictly mapped across the entire scrollable height of the page—progressing smoothly from the initial frame at the Hero to the final frame at the Footer.
> - **Confirmed Instant Reverse Response**: Upward scroll detection will immediately switch to the reverse video on the very first upward scroll delta (`deltaY < 0`), eliminating the previous accumulator lag that blocked reverse playback.
> - **Zero Stutter & Smooth Sync**: When scrolling, the active video plays smoothly toward the exact scroll target without hard seek stutter, and pauses cleanly when stationary.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Full-Page Timeline Stretching**: Maps the 10-second video duration directly to normalized scroll progress `[0.0, 1.0]` across the entire document height. At the top (Hero), video progress is 0.0s; at the middle (Committees / Schedule), it is ~4-6s; at the very bottom (Footer), it reaches the concluding frame ~10.0s.
  2. **Immediate Directional Flip**:
     - When `deltaY > 0` (scrolling down): Instantly displays and plays the forward video toward `progress * duration`.
     - When `deltaY < 0` (scrolling up): Instantly displays and plays the reverse video toward `(1 - progress) * duration`.
  3. **High-Performance rAF Playback Control**: Uses requestAnimationFrame to smoothly step video currentTime toward the target position matching scroll progress, guaranteeing zero playback stutter, zero backward seek hitches, and 60fps responsiveness.
- **Target Audience**: All delegates navigating ICON MUN across desktop, tablet, and mobile devices.
- **Key Value**: A true cinematic scroll-bound experience that stays alive across the entire website journey and instantly mirrors the user's scroll direction.

---

## 2. User Experience & Visual Design

- **Hero (0% Scroll)**: Mannequin in masked posture; forward video begins at 0.0s.
- **About & Councils (20% – 50% Scroll)**: Mask begins lifting and rotating smoothly.
- **Timeline & Secretariat (50% – 80% Scroll)**: Mask lifts further, revealing the elegant gold features; video continues playing actively and never freezes here.
- **Registry & Footer (80% – 100% Scroll)**: Concluding unmasking moment reaches full resolution at the bottom of the page.
- **Scrolling Up at Any Point**: Immediately plays the reverse video in reverse motion, smoothly putting the mask back on as you return toward the top.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Scroll-Progress Mapping vs. Real-Time Autonomous Play**
  - *Chosen Approach*: Tie video currentTime directly to page scroll progress using a smooth Lerp/rAF loop rather than autonomous real-time `.play()`.
  - *Why*: Autonomous `.play()` plays the 10-second video in 10 real-world seconds, meaning any user who spends more than 10 seconds scrolling reaches the end of the video by the middle of the page. Progress mapping guarantees the animation spans the full website length.
  - *Alternatives Considered*: Looping the video (breaks the narrative arc of the masquerade unmasking).
- **Decision 2: Instant DeltaY Direction Switching vs. Scroll Accumulator Threshold**
  - *Chosen Approach*: Remove the unbounded accumulator and switch direction immediately on the first directional change.
  - *Why*: The previous `scrollAccumulatorRef` accumulated thousands of positive pixels during downward scroll, which required thousands of pixels of reverse scrolling before reverse could ever trigger. Instant switching gives immediate, responsive feedback.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Window Scroll Event                  │
│               Calculates Progress [0.0 - 1.0]          │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ deltaY > 0 (Scroll Down) │  │ deltaY < 0 (Scroll Up)   │
│ - Forward Video Active   │  │ - Reverse Video Active   │
│ - Target = P * Duration  │  │ - Target = (1-P) * Dur   │
│ - Smooth rAF convergence │  │ - Smooth rAF convergence │
└──────────────────────────┘  └──────────────────────────┘
```

- **Interactive Component & State Mapping**:
  - `BackgroundVideoScrubber.tsx`:
    - Tracks normalized scroll progress: `P = window.scrollY / (scrollHeight - viewportHeight)`.
    - Forward target time: `targetFwd = P * duration`.
    - Reverse target time: `targetRev = (1 - P) * duration`.
    - Direction switch: If `deltaY > 0`, activate forward video and cross-fade; if `deltaY < 0`, activate reverse video and cross-fade.
    - Continuous rAF lerp: Smoothly updates currentTime toward the target position during active scroll, pausing when idle.
