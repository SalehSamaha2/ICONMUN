# Fluid 60fps Native Video Playback with Momentum Synchronization

Eliminate the stepped image-like slideshow by switching to continuous, hardware-accelerated 60fps native video playback (`video.play()`) dynamically synchronized with scroll momentum, gentle deceleration when resting, and absolute zero-reset protection at the footer.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in Phase 1:
>
> - **The Cause of Stepped Images**: Directly seeking `video.currentTime` on every scroll step forces the browser to decode and paint isolated static frames (keyframe jumping), which looks like an image slideshow rather than a moving video.
> - **Confirmed Fluid 60fps Motion**: Switch to continuous native video playback (`video.play()`) where the browser's GPU hardware decoder renders full-motion 60fps video:
>   - Playback rate dynamically tracks scroll momentum and velocity (0.75x to 2.2x).
>   - The video plays forward fluidly as you scroll, perfectly paced so it spans the entire length of the site.
> - **Confirmed Gentle Deceleration**: When you stop scrolling, playback smoothly decelerates and gently halts, cleanly holding the current frame without sudden freezing.
> - **Absolute Reset Prevention**:
>   - Bounded to `duration - 0.08s` so the native video never hits the `ended` state.
>   - `video.play()` is permanently locked from executing once at the footer, preventing the browser's auto-rewind to 0:00.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Continuous 60fps Hardware Playback**: Plays the local 3.7MB red-carpet MP4 natively through the browser's GPU compositor, delivering silk-smooth motion rather than stepped stills.
  2. **Momentum-Driven Rate Modulation**:
     - Calculates normalized scroll progress `P = [0.0, 1.0]`.
     - Target timeline: `targetTime = P * (duration - 0.08s)`.
     - If the video is lagging behind scroll position, it smoothly increases `playbackRate` up to 2.2x to catch up.
     - If the video is pacing ahead, it gently slows to 0.75x to stay aligned.
  3. **Gentle Deceleration on Stop**:
     - When scroll events rest, the engine smoothly eases `playbackRate` down over 120ms before calling `pause()`, creating a luxurious cinematic settle rather than a hard stop.
  4. **Strict Full-Site Timeline (Zero Resets)**:
     - The video begins at frame 0 at the Hero, moves continuously through the Diplomatic Constellation, Councils, and Secretariat, and concludes on the final frame at the Footer.
     - Never resets to 0:00.
- **Target Audience**: All delegates browsing the ICON MUN experience on desktop, tablet, and mobile.
- **Key Value**: A living, breathing cinematic backdrop that feels like a continuous movie responding fluidly to your scroll gestures.

---

## 2. User Experience & Visual Design

- **Hero (Top)**: Begins at frame 0 with ambient elegance.
- **Scrolling Down**: As you scroll through the editorial sections, the red carpet walking footage plays in fluid 60fps motion, naturally keeping pace with your speed.
- **Pausing**: When you stop to read, the video gently decelerates to a stop and holds the current frame.
- **Footer (Bottom)**: Seamlessly glides to the final step and stays frozen on the ceremonial finish.
- **Scrolling Up**: Smoothly steps backward to mirror previous sections.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Native Streaming Playback (`video.play()`) vs. Discrete Frame Seeking**
  - *Chosen Approach*: Stream natively at 60fps via `video.play()` with velocity-controlled `playbackRate`.
  - *Why*: Direct seeking steps between keyframes, causing a slideshow effect. Native playback decodes B/P-frames continuously at full framerate.
- **Decision 2: Clamped Playback vs. Ended State**
  - *Chosen Approach*: Clamp target time to `duration - 0.08s`.
  - *Why*: If a video reaches 100% of its file, browsers mark it `ended` and restart it on the next `play()`. Clamping before `ended` prevents the browser from ever auto-rewinding.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Scroll Delta Input                   │
│             Lenis / Native Scroll Listener             │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Active Scroll Momentum   │  │ Scroll Rest / Stop       │
│ - video.play() safe      │  │ - Eases playbackRate     │
│ - rate = f(velocity, P)  │  │ - 120ms gentle halt      │
│ - Fluid 60fps GPU render │  │ - Holds frame cleanly    │
│ - Never hits ended (10s) │  │ - ZERO rewind to 0:00    │
└──────────────────────────┘  └──────────────────────────┘
```

- **Component Implementation (`BackgroundVideoScrubber.tsx`)**:
  - Uses local `/assets/carpet-walking.mp4` with fallback to Cloudinary URL.
  - Controls playback smoothly via safe Promise tracking.
  - Dynamically modulates `playbackRate` based on normalized scroll progress.
  - Eases down and pauses when stationary.
  - Protects the final frame so it remains locked at the footer without looping.
