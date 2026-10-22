# ICON MUN — Official Model United Nations Platform

A luxury, high-performance web experience for ICON MUN, featuring scroll-scrubbed masquerade animations, cinematic video reveals, fluid typography, and bespoke responsive layouts tailored for mobile, tablet, and desktop devices.

---

## Mobile Architecture & Features

1. **Dynamic Viewport (`100dvh` with `100vh` fallback)**
   - All full-screen hero and intro sections utilize CSS `100dvh` to prevent layout jumps and white gaps when mobile browser address bars expand or collapse during scrolling.

2. **Safe-Area Inset Handling (`viewport-fit=cover`)**
   - Configured `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
   - Utilizes `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for fixed navigation bars, the cinematic intro skip button, captions, floating audio toggle, and footer elements so content never collides with notches, speaker cutouts, or iOS home indicators.

3. **Fluid Typography & Zero Horizontal Scroll**
   - Headings, captions, and hero titles use CSS `clamp()` scaling. The hero `"ICON MUN"` title is guaranteed to remain on a single line even on compact 360px-wide screens without overflow.
   - Body copy and form inputs are strictly $\ge 16\text{px}$ to eliminate iOS Safari's disruptive auto-zoom behavior on input focus.
   - Strict `overflow-x: hidden` enforced at the viewport boundary.

4. **Touch-Optimized Interaction & 44×44px Tap Targets**
   - Desktop custom cursor is automatically disabled on touch devices via `@media (hover: none) and (pointer: coarse)`.
   - Interactive elements (hamburger toggle, committee modal triggers, registration buttons, audio mute toggle, drawer links) provide minimum $44 \times 44\text{px}$ touch bounding boxes with instant active state feedback.
   - Responsive navigation menu transforms into a full-screen gold-accented mobile drawer that smoothly navigates to page sections and closes automatically.

5. **Bandwidth-Aware & Battery-Efficient Performance**
   - **Cinematic Intro**: Delivers an optimized 720px mobile video (`/assets/intro-mobile.mp4`) with `playsInline` and `webkit-playsinline`. Includes intelligent autoplay-block detection that renders a gold **"Enter Experience"** button if mobile power-saving or autoplay policies delay playback.
   - **Hero Scrubber**: Uses scaled 720px frame sequences (`/assets/frames-mobile/`) on mobile screens, caps `devicePixelRatio` at 2.0 to conserve GPU memory, and applies centered cover positioning focused on the masquerade mask.
   - **Scroll & Physics**: Configured Lenis with `syncTouch: false` to allow native, fluid touch scrolling while keeping GSAP ScrollTrigger timeline sync intact via `ScrollTrigger.normalizeScroll(true)` and debounced refresh on orientation changes.
   - **Particle Budget**: Mobile ambient particle count is restrained to 12–15 gold dust nodes with automatic canvas pausing when the browser tab is hidden or backgrounded.

---

## Mobile Testing Checklist

### 1. iPhone Safari (iOS)
- [ ] **Address Bar Behavior**: Scroll down and up continuously. Confirm that collapsing/expanding the Safari bottom tab bar or top URL bar causes zero vertical content jumping or layout shifts.
- [ ] **Safe-Area & Notch**:
  - Verify that the top navigation header and hamburger button clear the notch and Dynamic Island (`env(safe-area-inset-top)`).
  - Verify that the bottom skip button, audio toggle, and footer copyright clear the iOS home indicator bar (`env(safe-area-inset-bottom)`).
- [ ] **Autoplay & Video Inline**:
  - Ensure the cinematic intro video plays inline without launching Apple's native full-screen video player.
  - If low-power mode or battery saver restricts autoplay, verify that the golden **"Enter Experience"** fallback button appears and begins playback on first tap.
- [ ] **Form Inputs & Auto-Zoom**: Tap on any input in the Delegate Registration modal. Verify that Safari does **not** perform an unwanted page zoom (input font size is $\ge 16\text{px}$).
- [ ] **Hero Scrubbing**: Drag finger vertically across the hero section. Verify the mannequin mask smoothly lifts and returns without rubber-band stutter.

### 2. Android Chrome
- [ ] **Dynamic Viewport Height**: Scroll through the hero and verify that `100dvh` maintains exact full-height sizing when the URL toolbar scrolls away.
- [ ] **Performance & FPS**: Check that gold ambient dust particles animate at 60fps without thermal throttling or dropped frames.
- [ ] **Network Throttling Fallback**: On slow 3G or constrained cellular connections, verify the 2-second timeout gracefully unlocks the intro into the hero if video buffering is prolonged.
- [ ] **Touch Target Usability**: Tap buttons and links; verify all targets respond promptly with visible feedback and no accidental double-taps.

### 3. iPad / Tablets (768px – 1024px)
- [ ] **Portrait Mode (768px)**:
  - Secretariat grid shifts neatly into 2 columns.
  - About section stat cards display in a balanced 2×2 layout.
  - Committees show structured cards with visible badges and description teasers.
- [ ] **Landscape Mode (1024px)**:
  - Transition between hamburger navigation and expanded desktop navigation bar occurs seamlessly.
  - Scrubbed hero canvas scales to fill viewport height with centered mannequin framing.

### 4. Orientation Testing (Portrait & Landscape on Phones)
- [ ] **Short Landscape Viewports (Height < 500px)**:
  - Turn phone horizontally. Verify that the hero title, skip button, and intro logo scale proportionally to fit the reduced vertical height.
  - Confirm modal dialogs remain vertically scrollable so the submit button is always reachable.

---

## How to Preview with Chrome DevTools Device Mode

1. **Open DevTools**:
   - In Google Chrome, press `F12` (Windows/Linux) or `Cmd + Option + I` (macOS).
2. **Toggle Device Toolbar**:
   - Click the **Device Toggle** icon at the top-left of DevTools, or press `Ctrl + Shift + M` / `Cmd + Shift + M`.
3. **Select Preset Viewports or Enter Custom Dimensions**:
   - **360 × 740 px**: Samsung Galaxy S8/S9 / standard compact Android
   - **390 × 844 px**: iPhone 13 / 14 / 15
   - **430 × 932 px**: iPhone 14 Pro Max / 15 Pro Max
   - **768 × 1024 px**: iPad Mini / iPad Portrait
   - **1440 × 900 px**: Modern Desktop Display
4. **Simulate Touch & Orientation**:
   - Set the throttle dropdown to **Mid-tier mobile** or **Low-tier mobile** to verify frame scrubbing and particle performance.
   - Click the **Rotate** button in the device toolbar to test transitions between Portrait and Landscape modes.
   - In the three-dots menu inside the device toolbar, select **"Show device frame"** to view realistic screen cutouts.
5. **Simulate Reduced Motion & Data Saver**:
   - Open DevTools Command Menu (`Ctrl + Shift + P` or `Cmd + Shift + P`), type `Emulate CSS prefers-reduced-motion: reduce`, and test the instant static hero mode.
