# Eliminate Scroll Jumping & Restore Natural Fluid Scrolling

Completely eliminate page scroll jumping, snapping, and section resets by removing invasive ScrollTrigger DOM pinning (`pin: true`, `pinSpacing: true`) in the Councils and Registration sections, switching Councils to a natural fluid layout, and streamlining scroll progress tracking directly through standard requestAnimationFrame.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in Phase 1:

- **Confirmed Issue Cause**: The page was jumping/snapping back because ScrollTrigger was dynamically injecting and removing pin spacers (`pinSpacing: true`) around sections while Lenis was running, causing severe height recalculations that snapped the scroll position back.
- **Confirmed Councils Layout**: Switched from screen-locking horizontal pinning to a natural, fluid vertical/responsive card grid where the page scrolls continuously with zero interruption or screen hijacking.
- **Confirmed Scroll Stability**: Removed the recursive `ScrollTrigger.create` on `document.documentElement` that fought with Lenis, stabilizing the document scroll height so visitors can scroll freely up and down with buttery smoothness.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Removes Invasive Pin Spacers**: Strips `pin: sticky` and `pinSpacing: true` from `CommitteesSection.tsx` and `RegistrationSection.tsx`. The document height remains 100% constant and stable, preventing browser scroll jumps.
  2. **Natural Council Presentation**: Delegates can scroll effortlessly through the councils without getting locked into a horizontal track.
  3. **Direct Velocity Video Sync**: The background video tracks window scroll progress via a decoupled, non-blocking `requestAnimationFrame` listener, ensuring the video responds instantly to scroll direction and velocity without interfering with page scroll coordinates.
- **Target Audience**: All delegates and site visitors on desktop, tablet, and mobile browsers.
- **Key Value**: Fluid, unhindered scrolling where the user is always in total control of their position on the page, with zero snapping or rubber-banding.

---

## 2. User Experience & Visual Design

- **Smooth Continuous Flow**:
  - **Hero**: Scrolls smoothly into the About section without hesitation.
  - **Councils**: Clean, responsive layout of council cards with transparent backgrounds and gold borders that delegates can comfortably read through.
  - **Schedule & Secretariat**: Smooth timeline and leadership cards progressing naturally.
  - **Registration & Footer**: Scrolls into the call to action and closing footer, where the video animation concludes gracefully.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Natural Scrolling vs. Scroll Hijacking (Pinning)**
  - *Chosen Approach*: Remove all `pin: true` / `pinSpacing: true` from the codebase.
  - *Why*: Pinning freezes vertical scroll to force horizontal translation. When combined with smooth-scroll libraries (Lenis), it causes layout thrashing, incorrect offset calculations, and snap-back glitches. Natural scrolling is always smoother, more predictable, and accessible.
- **Decision 2: Direct Window Scroll Listener vs. DocumentElement ScrollTrigger**
  - *Chosen Approach*: Drive the video engine from a single passive `window.addEventListener('scroll')` debounced via rAF.
  - *Why*: Eliminates the circular dependency where ScrollTrigger updates caused DOM reflows that triggered more ScrollTrigger updates.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Natural Window Scroll                │
│             Lenis Smooth Momentum (No Pinning)         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼ (Passive / Zero DOM Reflow)
┌────────────────────────────────────────────────────────┐
│  BackgroundVideoScrubber                               │
│  - Progress = window.scrollY / (scrollHeight - vh)     │
│  - Scroll Down: masque-forward.mp4 (native 60fps play) │
│  - Scroll Up:   masque-reverse.mp4 (native 60fps play) │
│  - Stationary:  pause() without repositioning jumps    │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Natural Section Stack (Zero Pin Spacers)              │
│  - HeroSection (Transparent)                           │
│  - AboutSection (Transparent)                          │
│  - CommitteesSection (Responsive fluid card grid)      │
│  - ScheduleSection (Continuous vertical timeline)      │
│  - SecretariatSection (Fluid team cards)               │
│  - RegistrationSection (Continuous CTA flow)           │
│  - FooterSection (Full unmasking reveal)               │
└────────────────────────────────────────────────────────┘
```
