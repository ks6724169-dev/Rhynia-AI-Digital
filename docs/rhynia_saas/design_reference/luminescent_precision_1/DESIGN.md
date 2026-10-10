---
name: Luminescent Precision
colors:
  surface: '#131318'
  surface-dim: '#131318'
  surface-bright: '#39393e'
  surface-container-lowest: '#0e0e13'
  surface-container-low: '#1b1b20'
  surface-container: '#1f1f24'
  surface-container-high: '#2a292f'
  surface-container-highest: '#35343a'
  on-surface: '#e4e1e9'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e4e1e9'
  inverse-on-surface: '#303035'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131318'
  on-background: '#e4e1e9'
  surface-variant: '#35343a'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
  space-2xl: 3.5rem
---

## Brand & Style

This design system embodies an ultra-refined, futuristic conversational environment engineered for deep focus, intelligence, and fluid interaction. The visual aesthetic fuses high-end dark minimalism with restrained glassmorphic depth and precise tactile touches. 

### Core Ethos
- **Fluid Intelligence:** The interface feels living, responsive, and weightless without being distracting or frivolous.
- **Multilingual Clarity:** Balanced proportion and rhythm designed specifically to harmonize Latin and Devanagari letterforms seamlessly side by side.
- **Precision Focus:** Content is king; message bubbles, model responses, and tactile inputs emerge organically from a void-black canvas through tonal tiers rather than harsh boundaries.

### Target Emotional Response
Users should feel an immediate sense of quiet power, clarity, and modern luxury—evoking the tactile precision of bespoke hardware coupled with the responsiveness of cutting-edge computational intelligence.

## Colors

The palette is rooted in an abyss-grade neutral foundation (`#09090D` to `#16161F`) that minimizes eye strain and eliminates OLED pixel activation where possible. 

### Accent System
- **Electric Violet (`#8B5CF6`):** The primary intellectual signal. Represents active generation, focal state, and core user actions.
- **Atmospheric Blue (`#3B82F6`):** Secondary state indicator for network queries, streaming tools, and informational breadcrumbs.
- **Emerald Pulse (`#10B981`):** Tertiary status indicator representing high model confidence, active sessions, and successful executions.
- **Warm Ambers (`#F59E0B`) & Radiant Crimson (`#EF4444`):** Contextual accents reserved strictly for attention-critical and safety thresholds.

### Surface Architecture
- **Base Canvas:** Deep Charcoal Void (`#09090D`)
- **Surface Layer 1 (Chat Stream):** `#0F0F14`
- **Surface Layer 2 (Glass Cards & Assistant Bubbles):** `rgba(22, 22, 31, 0.72)` with a 1px composite rim of `rgba(255, 255, 255, 0.08)`.
- **Surface Layer 3 (Tactile Pills & Flyouts):** `rgba(30, 27, 46, 0.85)`
- **Text & Glyphs:** High-contrast neutral (`#F4F4F6`), subtle neutral (`#9494A8`), and ghost neutral (`#525266`).

## Typography

Typography prioritizes universal legibility, structural symmetry, and seamless bilingual flow between English and Hindi scripts. 

### Linguistic Balancing (Devanagari & Latin)
When rendering Hindi alongside English:
- Maintain an explicit line-height multiplier of at least 1.55x on `body-md` and `body-lg` to prevent matra clipping across ascending and descending Devanagari marks.
- Keep optical weights consistent: pair Latin regular weights with standard Devanagari weights without faux-bolding.

### Structural Roles
- **Headlines (Plus Jakarta Sans):** Geometric, contemporary curves that soften the clinical nature of tech interfaces while maintaining decisive authority.
- **Body & Controls (Inter):** High x-height, neutral horizontal proportions, and open counters guarantee effortless readability during extended multi-turn chat sessions.

## Layout & Spacing

The layout operates on a centered, responsive single-column conversation conduit flanked by optional collateral panels on expanded viewports.

### Viewport Breakpoints
- **Mobile (< 768px):** Single-column edge-to-edge flow. Canvas margin locked to `space-md` (`1rem`). The persistent composer pill floats anchored above bottom system gesture zones.
- **Tablet (768px - 1024px):** Single-column centered conversation track with a strict max-width of `720px`. Canvas margin increases to `2rem`.
- **Desktop (> 1024px):** Dual-zone layout featuring an collapsible lateral index (`280px` fixed) and an auto-centering conversational thread capped at `840px` max-width.

### Vertical Rhythm
- Bubble-to-bubble spacing within the same speaker: `space-xs` (`0.25rem`).
- Turn-to-turn spacing (User to AI change): `space-lg` (`1.5rem`).
- Component interior padding adheres strictly to the 4px baseline rhythm (`0.5rem`, `1rem`, `1.5rem`).

## Elevation & Depth

Visual hierarchy does not rely on harsh opacity drops or opaque gray blocks. Instead, it utilizes translucent optical layering, selective backdrop blurring, and micro-luminance highlights.

### Layer Architecture
- **Layer 0 (Canvas):** Pure `#09090D` surface; inert.
- **Layer 1 (Glassmorphic Cards / AI Response Blocks):** `rgba(22, 22, 31, 0.65)` with `backdrop-filter: blur(16px)` and a directional top highlight: `inset 0 1px 0 0 rgba(255, 255, 255, 0.07)`.
- **Layer 2 (Floating Composer & Dialog Overlays):** `rgba(26, 26, 38, 0.85)` with `backdrop-filter: blur(24px)`, enclosed in a perimeter border of `1px solid rgba(139, 92, 246, 0.18)` and an ambient, colored glow: `0 12px 32px -8px rgba(0, 0, 0, 0.65), 0 0 24px -4px rgba(139, 92, 246, 0.12)`.
- **Layer 3 (Popovers, Tooltips & Floating Pill Actions):** `rgba(34, 34, 48, 0.95)` with `0 8px 24px -4px rgba(0, 0, 0, 0.8)`.

### Rim Highlights & Ghost Borders
Borders must never exceed `1px` in thickness. Instead of solid gray borders, use linear alpha gradients (`rgba(255, 255, 255, 0.12)` down to `rgba(255, 255, 255, 0.02)`) to simulate overhead light catching the bevel of glass panels.

## Shapes

The shape system adopts a pill-shaped and continuous-curve language (`roundedness: 3`) to foster a tactile, approachable, and ergonomic feel across touchpoints.

### Corner Radii Conventions
- **Primary Input Shell / Floating Composer:** Fully rounded continuous pill (`9999px`).
- **Contextual Chips & Action Buttons:** Fully rounded continuous pill (`9999px`).
- **User Message Bubbles:** Asymmetric rounding—`1.5rem` (`24px`) on exterior curves, tapering down to `0.375rem` (`6px`) on the bottom-trailing tail corner.
- **System Message Containers & Code Shells:** `1.25rem` (`20px`) squircle radius.
- **Modals & Bottom Drawers:** `1.5rem` (`24px`) top corners on mobile viewports; uniform `1.5rem` on desktop overlays.

## Components

### 1. Tactile Input Composer
- **Geometry:** Ergonomic floating pill container (`min-height: 54px`, `border-radius: 9999px`).
- **Surface:** `rgba(22, 22, 31, 0.85)` with `backdrop-filter: blur(20px)`.
- **Border:** 1px `rgba(255, 255, 255, 0.08)`. Transition to `rgba(139, 92, 246, 0.5)` on input focus accompanied by a subtle `0 0 16px rgba(139, 92, 246, 0.25)` ambient ring.
- **Action Triggers:** Dual internal docks. Left: Multimodal attach icon (`20px` crisp stroke). Right: Audio wave/mic button transitioning dynamically to a circular violet send button (`36px` circle) when text is entered.

### 2. Message Bubbles
- **User Bubbles:** Right-aligned, compact, saturated background featuring an axial violet gradient (`linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)`). Text color is crisp white (`#FFFFFF`).
- **AI Response Units:** Left-aligned, unboxed or set within ultra-subtle frosted backing (`rgba(255, 255, 255, 0.03)`). No dense background colors. Left edge features a micro status badge (model indicator with accent hue dot).

### 3. Action Chips & Prompt Suggestion Pills
- **Geometry:** Height `34px`, fully rounded pill (`9999px`), horizontal padding `14px`.
- **States:**
  - *Rest:* Background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.08)`, text `#9494A8`.
  - *Hover/Press:* Background `rgba(139, 92, 246, 0.15)`, border `1px solid rgba(139, 92, 246, 0.4)`, text `#F4F4F6`.

### 4. Mode Switchers & Theme Indicators
- Discrete circular or pill badges indicating active model mode (e.g., 🟣 Creative, 🔵 Reasoning, 🟢 Real-time Search).
- Contains a centered `6px` glowing radial bead next to the label (`label-sm`).

### 5. Checkboxes, Toggles & Radios
- **Toggle Switches:** Tactile track (`44px x 24px`, background `rgba(255, 255, 255, 0.1)`). Thumb is a crisp white disc (`18px`) that shifts smoothly along an easing curve with an active violet fill (`#8B5CF6`) on switch-on.
- **Checkboxes:** Smooth squircle (`18px x 18px`, radius `5px`), border `1.5px solid rgba(255, 255, 255, 0.2)`. Active state fills with `#8B5CF6` featuring an SVG micro checkmark.

### 6. Code Blocks & Data Artifacts
- Contained inside Layer 1 frosted panels with an integrated top metadata bar showing syntax language (e.g., `PYTHON`, `JSON`) and a tactile "Copy" chip (`label-sm`).
- Code font: Monospaced Inter/System Mono with balanced syntax highlighting in pastel cyan, violet, and amber hues.