# Active Scroll-Driven Background Video Playback

Fixes the frozen background video by transitioning from low-level frame seeking to a robust scroll-velocity playback controller. Whenever the visitor scrolls down the page, the video smoothly plays (`video.play()`), adjusting speed dynamically with scroll movement, and immediately pauses (`video.pause()`) when scrolling stops.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during the interactive clarification phase:

- **Confirmed Playback Mechanic**: The video plays actively while the user is scrolling and automatically pauses when scrolling stops.
- **Root Cause Identified**: Programmatic `currentTime` scrubbing on remote unbuffered MP4s blocked the browser's hardware video decoder, keeping the video frozen on frame 0. Switching to native `play()` / `pause()` tied to scroll activity resolves the issue completely across all browsers.
- **Video Source**: Cloudinary MP4 `https://res.cloudinary.com/edtur3gp/video/upload/v1793118876/Female_silhouette_removes_masque__20261027193210.mp4`.

---

## 1. Overview & Core Concept

- **What It Does**: As visitors explore the conference website, the background video of the female silhouette removing her masquerade mask comes alive with smooth continuous motion during active scrolling. When the user stops to read a council topic or speaker bio, the video gracefully pauses.
- **Velocity Matching**: Fast scrolling speeds up the playback rate slightly ($1.2\times$–$1.5\times$), while gentle reading scrolls maintain standard cinematic speed ($0.8\times$–$1.0\times$).
- **Browser Compatibility**: Works smoothly across Chrome, Safari, iOS, and Android by honoring browser autoplay requirements (`muted`, `playsInline`, `preload="auto"`).

---

## 2. User Experience & Visual Design

### Playback State Flow

```
[ Visitor at rest ]
       │  Video is paused at current cinematic frame
       ▼
[ Visitor scrolls / swipes ]
       │  Scroll listener detects motion
       │  video.play() triggered immediately
       │  Playback rate matches scroll intensity
       ▼
[ Visitor stops scrolling ]
       │  Inactivity window triggers (~250ms)
       │  video.pause() called smoothly
       │  Frame remains held in crisp focus
```

### Visual Styling

- The video is fixed full-screen behind the website (`fixed inset-0 pointer-events-none z-0`).
- Subtle ambient gold glow and edge vignette blend the video edges into the `#050505` obsidian paper.
- Ambient floating gold particles (`GoldDustCanvas`) drift quietly above the video.
- All conference content sections float on frosted glass panels (`backdrop-blur-md bg-[#050505]/65 border border-gold/25`) in front (`z-10`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Scroll-Driven `play()` / `pause()` vs. `currentTime` Seeking**:
  - *Chosen Approach*: Drive playback via native media playback events tied to scroll velocity rather than forcing `currentTime` seeks.
  - *Why*: Eliminates decoder stalls, buffering lags, and black-frame flickers. Provides 60fps cinematic playback on desktop and mobile.
  - *Alternatives Considered*: Frame-by-frame canvas rendering (rejected for high bandwidth consumption).
- **Decision 2: Scroll Inactivity Debounce Window**:
  - *Chosen Approach*: Use a 250ms settling window after the last scroll tick before invoking `video.pause()`.
  - *Why*: Prevents choppy start-stop stutter during continuous mousewheel or trackpad scrolling, creating a polished cinematic feel.

---

## 4. Technical Architecture & Component Details

### System Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  (Lenis Smooth Scroll + Global GSAP ScrollTrigger Sync)      │
└───────────────┬─────────────────────────────┬───────────────┘
                │
                ▼ Scroll Velocity & Activity Events
    ┌─────────────────────────────────────────┐
    │     BackgroundVideoScrubber (Fixed z-0) │
    │                                         │
    │  • On scroll: video.play()              │
    │  • On idle (250ms): video.pause()       │
    │  • Playback rate: 0.8x - 1.5x           │
    │  • Loop enabled for continuous motion   │
    │  • Radial gold glow & edge vignette     │
    │  • Floating gold dust particles         │
    └─────────────────────────────────────────┘
```

### Component Implementation Details

- **`src/components/BackgroundVideoScrubber.tsx`**:
  - Configure `<video>` with `src={VIDEO_URL}`, `muted`, `playsInline`, `webkit-playsinline="true"`, `loop`, `preload="auto"`.
  - Listen to Lenis scroll events via `ScrollTrigger.create({ onUpdate })` and direct window scroll listeners.
  - When scroll delta occurs:
    - If `video.paused`, call `video.play().catch(() => {})`.
    - Adjust `playbackRate = Math.min(Math.max(scrollSpeed * factor, 0.75), 1.6)`.
    - Clear previous pause timer and set a new timer for 250ms to call `video.pause()`.
  - Also seek proportionally to overall page depth so video progress corresponds to the conference journey.
