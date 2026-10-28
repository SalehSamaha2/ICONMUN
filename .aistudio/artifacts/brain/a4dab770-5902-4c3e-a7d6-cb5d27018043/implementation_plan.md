# Post-Intro Cinematic Transition: Logo Flight & Hero Scale-Down

Creates a continuous visual hand-off between the intro animation and the live website. As the grand curtains part, the central masquerade emblem dynamically glides and scales directly into the top-left navigation bar, while the Hero section executes a dramatic cinematic scale-down from $1.18\times$ with motion blur into crisp $1.0\times$ focus.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during the interactive clarification phase:

- **Confirmed Logo Flight Hand-off**: The intro's central gold emblem does not disappear; it animates across the viewport directly into the top-left navbar slot (`#nav-brand-logo`), synchronizing with the header's entrance.
- **Confirmed Hero Reveal**: As the curtains part, the Hero section scales down dramatically from $1.18\times$ (with subtle atmospheric blur) to $1.0\times$ normal scale with golden light flare, revealing the background video and live interface in unison.
- **Skip Integration**: Clicking "Skip ↗" triggers the same fluid logo-flight and scale-down transition in an accelerated $0.4\text{s}$ sweep.

---

## 1. Overview & Core Concept

- **The Flow**:
  1. Intro concludes its branding sequence.
  2. The script computes the precise screen coordinates of the navigation logo (`navLogo.getBoundingClientRect()`).
  3. The curtains sweep outward (`left: -100%`, `right: +100%`).
  4. The intro emblem flies smoothly along an ease curve into the navbar position, scaling down from $140\text{px}$ to $48\text{px}$.
  5. Simultaneously, the Hero container scales down from $1.18\times$ to $1.0\times$, settling the typography and CTA buttons into place over the active background video.

---

## 2. User Experience & Visual Design

### Transition Choreography

```
[ Curtain Parting Triggered ]
       │
       ├─────────────────────────────────┬─────────────────────────────────┐
       ▼                                 ▼                                 ▼
[ Curtains Sweep Open ]          [ Logo Flight ]                  [ Hero Scale-Down ]
  • Left curtain -> -101%          • Reads navbar [x, y] target     • Starts at scale 1.18x
  • Right curtain -> +101%         • Moves via power3.inOut         • Blur 12px -> 0px
  • Smooth 0.8s sweep              • Scales: 140px -> 48px          • Scales to 1.0x (expo.out)
                                   • Arrives with subtle gold halo  • Title & CTAs settle
                                         │                                 │
                                         └────────────────┬────────────────┘
                                                          ▼
                                    [ Website Live & Fully Interactive ]
```

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dynamic Bounding Box vs. Hardcoded Pixel Offsets**:
  - *Chosen Approach*: Query `getBoundingClientRect()` of the target navbar logo at transition time.
  - *Why*: Works flawlessly across all screen widths (mobile, tablet, ultra-wide desktop) regardless of responsive padding.
- **Decision 2: Coordinated State Hand-off**:
  - *Chosen Approach*: Pass `introProgress` and `isIntroExiting` state flags to `Navigation` and `HeroSection`.
  - *Why*: Prevents pop-in or duplicate logos. The navbar logo remains invisible until the flying emblem reaches its final resting position, where it dissolves cleanly into the header.

---

## 4. Technical Architecture & Component Implementation

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                          App.tsx                            │
│  State: introComplete, isIntroExiting                       │
├─────────────────────────────────────────────────────────────┤
│  • <CinematicIntro onExiting={...} onComplete={...} />      │
│  • <Navigation targetRef={navLogoRef} showLogo={...} />     │
│  • <HeroSection isExiting={isIntroExiting} />               │
│  • <BackgroundVideoScrubber />                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

1. **Update `Navigation.tsx`**:
   - Add id/ref `#nav-brand-logo` on the brand emblem container for coordinate targeting.
2. **Update `CinematicIntro.tsx`**:
   - Add target coordinate measurement for the flight path.
   - Animate `emblemRef` along `(targetX, targetY)` and scale down to match the navbar badge size.
   - Invoke `onExiting()` callback as the curtains part.
3. **Update `HeroSection.tsx`**:
   - Receive `isIntroExiting` prop to drive the cinematic scale-down from $1.18\times$ with blur into $1.0\times$ focus.
4. **Verify**:
   - Test build and check compilation.
