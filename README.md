# ICON MUN — Fast, Lightweight Scroll-Animated Cinematic Website

A single-page, fast, lightweight, and scroll-animated cinematic website for **ICON MUN**, a dark black-and-gold Model United Nations conference. Every section is choreographed directly to user scroll progress via **GSAP + ScrollTrigger** and **Lenis**.

---

## ⚡ Performance & Page Architecture

- **Total Page Length**: ~10 screen heights total.
  - **Hero**: Pinned `250vh` (mobile `180vh`).
  - **Committees**: Pinned `150vh` (desktop horizontal translation; mobile natural vertical stack).
  - **Registration**: Pinned `120vh`.
  - **About, Schedule, Secretariat, Footer**: Natural flow (~100vh each). No empty gaps.
- **Transform & Opacity ONLY**: All scroll animations exclusively manipulate `transform` (`translate3d`, `scale`, `rotate`) and `opacity` (plus SVG `strokeDashoffset`), never `width`, `height`, `top`, `left`, `box-shadow`, or `filter: blur`.
- **Single Shared rAF Loop**: One requestAnimationFrame loop connecting Lenis and the GSAP ticker (`gsap.ticker.add(...)`).
- **ScrollTrigger scrub**: Set to `0.5` across all timelines for instantaneous, buttery response in both directions.
- **Gold Dust Particles**: Single fixed canvas with 40 particles on desktop and 15 on mobile, automatically paused when the browser tab is hidden.

---

## 🖼️ Canvas Frame Sequence (Primary Hero)

For maximum 60fps performance and instantaneous bidirectional scrubbing with 0 decoder latency, the hero utilizes a pre-extracted **WebP Frame Sequence** drawn onto a `<canvas>` element:
- 96 optimized WebP frames at 1280px width located in `/public/assets/frames/frame_0001.webp` through `frame_0096.webp`.
- Frame 1 is loaded immediately for instant paint.
- Fallback video scrubbing is automatically activated if frame images are unavailable.

### Frame Extraction Command (FFmpeg):
To re-extract or replace frames from any input video:

```bash
ffmpeg -i mask.mp4 -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 70 assets/frames/frame_%04d.webp
```

### Keyframe Video Re-Encoding (Fallback):
If using the MP4 video fallback:

```bash
ffmpeg -i input.mp4 -g 1 -an -movflags +faststart output.mp4
```

---

## 🎭 The 6 Cinematic Sections

1. **Cinematic Intro**:
   - Golden mask emblem logo (`/assets/logo.png`) with UN-style laurel wreath and soft gold radial glow.
   - Title letters rise with a continuous gold glint shimmer and 30 jewel sparkles.
   - Velvet curtains slide open upon hero frame 1 readiness. Includes skip button and session persistence.
2. **Hero — The Mask Reveal (Pinned 250vh)**:
   - WebP frame sequence scrubbed bidirectionally from `0.0 → 1.0`.
   - Scrolling down removes the gold masquerade mask from the black mannequin; scrolling up puts it back on.
   - Fixed HTML title in top safe zone.
   - Three scroll-linked captions swapping in the bottom safe zone:
     - `0–30%`: *"Every nation has a face."*
     - `30–65%`: *"But behind every mask…"*
     - `65–100%`: *"…is a delegate ready to lead."*
3. **About Section**:
   - SVG gold border frame draws around the card via `strokeDashoffset`.
   - Direct DOM numerical stat counters (`42+ Member States`, `5 Councils`, `72H Debate`, `100% Immersion`).
4. **Committees (Pinned 150vh Desktop)**:
   - Desktop: Vertical scroll translates horizontally across 5 councils (UNSC, UNHRC, DISEC, WHO, ECOSOC).
   - Card closest to center scales to `1.04` and brightens; adjacent cards dim to `0.7`.
   - Mobile: Plain vertical stack without pinning.
   - Interactive classified dossier modal with policy inquiries and sovereign portfolios.
5. **Schedule Section**:
   - Vertical gold line draws downward (`scaleY: 0 → 1`) with glowing tip node (`translate3d`).
   - Cards slide in smoothly from alternating sides. Outlined day numbers fill with gold.
6. **Secretariat Section**:
   - SVG circular rings draw around high diplomats. Portraits scale `0.9 → 1.0`.
7. **Registration (Pinned 120vh)**:
   - Headline *"Take Off Your Mask. Take the Floor."* scales up (`0.65 → 1.0`).
   - Rotating UN-style globe behind. "Register Now" reveals the full interactive diplomatic application modal with provisional delegate pass generation.
8. **Footer**:
   - Contacts rise up; giant outlined "ICON MUN" fills with gold at page terminus.

---

## 🎨 Asset Paths
- **Official Crest Logo**: `/public/assets/logo.png`
- **Hero Frame Sequence**: `/public/assets/frames/frame_0001.webp` … `frame_0096.webp`
- **Fallback Mask Video**: `/public/assets/mask-video.mp4`
