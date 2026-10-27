# Eliminate Video Startup Latency & Stutter

Completely resolve video playback lag and unresponsive startup by eliminating the rapid `play()` / `pause()` conflict cycle, removing per-tick remote HTTP seeks, and implementing a debounced hardware-accelerated playback controller that responds instantly to user scroll.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Identified Lag Cause**: The background video was stuttering and failing to start because the rAF monitor was calling `video.pause()` within 16ms of `video.play()` being invoked. Calling `pause()` while the browser's asynchronous `play()` Promise is resolving causes continuous `AbortError` pipeline aborts, thread contention, and delayed video startup.
> - **Identified Seeking Lag**: When scrolling upward, direct assignments to `video.currentTime` on the remote Cloudinary video triggered network byte-range cancellations.
> - **Architecture Solution**:
>   1. **Robust Playback State Machine**: Only call `play()` once when entering the active scrolling state, and only call `pause()` when scrolling has settled via a clean debounced timeout (150ms). Never call `pause()` immediately in the next animation frame while a `play()` promise is in-flight.
>   2. **Dynamic Rate Synchronization**: Modulate `video.playbackRate` (0.75x to 2.2x) to track scroll progression smoothly across the full page height (Hero to Footer) without seeking.
>   3. **Instant Responsiveness**: Direct binding to scroll delta initiates playback on the first touch event with zero delay.
>   4. **End-of-Page Anchoring**: When the user reaches the bottom (Footer), the video cleanly pauses on the final frame without looping or resetting.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Instant First-Scroll Reaction**: On the first detected scroll delta, the video starts playing immediately. In-flight play promises are tracked cleanly so they are never interrupted or rejected.
  2. **Full-Page Timeline Pacing**: The video rate is dynamically paced so that progress reaches 100% precisely as the user scrolls into the Footer, spanning the entire site smoothly.
  3. **Zero Rapid Toggling**: Replaces the per-frame `play()`/`pause()` check with a clean scroll-idle debounce timer. While scrolling continues, the video plays continuously at a speed proportional to scroll velocity. When scrolling stops, the video comes to a gentle rest.
  4. **No Remote HTTP Seek Thrashing**: Eliminates remote seeks during active scroll, allowing the video stream to stay buffered and GPU-accelerated.
- **Target Audience**: All delegates browsing ICON MUN across desktop, tablet, and mobile.
- **Key Value**: Immediate, buttery 60fps video responsiveness with zero startup delay and zero frame drops.

---

## 2. User Experience & Visual Design

- **Hero (Top)**: Video begins on frame 1 beneath the red-carpet editorial palette.
- **Instant Activation**: The moment the user touches the scroll wheel or trackpad, the video starts moving with zero lag.
- **Continuous Flow**: As you scroll through the Diplomatic Constellation, Councils, Timeline, and Secretariat, the video plays smoothly and stays paced with your progress.
- **Footer**: Reaches the final frame and cleanly holds without resetting to 0:00.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Debounced State Transition vs. Per-Frame Clamping**
  - *Chosen Approach*: Control `play()` on scroll start and `pause()` on scroll rest via an idle debounce timer (150ms). Pacing is managed via `playbackRate`, not rapid pause toggling.
  - *Why*: Eliminates the browser's `AbortError: The play() request was interrupted by a call to pause()`, which was causing the startup lag and freezing.
- **Decision 2: Seamless Stream Buffering**
  - *Chosen Approach*: Let the browser buffer the video normally, avoiding mid-scroll `currentTime` jumps on remote media.
  - *Why*: Ensures hardware decoding stays at 60fps throughout the entire scroll journey.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Scroll Delta Event                   │
│             Fires Immediately on User Input            │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ On Scroll Start:         │  │ On Scroll Resting:       │
│ - Cancel pause timer     │  │ - 150ms idle debounce    │
│ - video.play() safely    │  │ - video.pause()          │
│ - Adjust playbackRate    │  │ - Holds frame cleanly    │
│ - Zero AbortErrors       │  │ - Zero resets            │
└──────────────────────────┘  └──────────────────────────┘
```

- **Component Implementation (`BackgroundVideoScrubber.tsx`)**:
  - Safely awaits/tracks `video.play()` Promise to prevent race conditions.
  - Smoothly adjusts `video.playbackRate = speed` based on scroll velocity and drift relative to `getScrollProgress()`.
  - Removes the conflicting rAF monitor that was calling `video.pause()` every frame.
  - Replaces it with a 150ms idle debounce that halts playback only when user stops scrolling.
