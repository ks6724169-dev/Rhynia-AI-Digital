---
name: Fluent Dark Horizon
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1c'
  surface-container: '#202020'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c0c7d4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#303030'
  outline: '#8a919e'
  outline-variant: '#404752'
  surface-tint: '#a3c9ff'
  primary: '#a3c9ff'
  on-primary: '#00315c'
  primary-container: '#0078d4'
  on-primary-container: '#ffffff'
  inverse-primary: '#0060ab'
  secondary: '#8ecdff'
  on-secondary: '#00344f'
  secondary-container: '#00a4ef'
  on-secondary-container: '#003653'
  tertiary: '#1cdec3'
  on-tertiary: '#00382f'
  tertiary-container: '#008674'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a3c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#cbe6ff'
  secondary-fixed-dim: '#8ecdff'
  on-secondary-fixed: '#001e30'
  on-secondary-fixed-variant: '#004b71'
  tertiary-fixed: '#50fbdf'
  tertiary-fixed-dim: '#1cdec3'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005045'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353535'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.015em
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.75rem
  gutter-loose: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-wide: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system embodies the next evolution of modern desktop and enterprise cloud interfaces: quiet, ambient, highly disciplined, and ergonomically precise. Built on the principles of sensory depth and functional clarity, the system leverages physical metaphors of light, material translucency (Mica and Acrylic), and micro-surface differentiation rather than abrasive structural borders.

The target audience encompasses power users, knowledge workers, software engineers, and enterprise leaders who inhabit complex, multi-window productivity environments for hours every day. The visual tone must elicit focused serenity, instantaneous computational confidence, and refined sophistication.

Key styling tenants include:
- **Mica & Atmospheric Materials:** Translucent base surfaces that subtly sample desktop or ambient canvas luminance, layered beneath opaque application canvases.
- **Micro-Boundary Definition:** Crisp, hair-line micro-strokes (0.5px to 1px) that reflect top-lit illumination rather than heavy drop shadows.
- **Intelligent Luminous Accents:** Precision usage of vibrant kinetic blues and cyans evoking AI coproduction, focused strictly on active states, primary commands, and dynamic telemetry.

## Colors

The palette establishes an ergonomic dark environment calibrated to reduce ocular strain while preserving strict WCAG 2.1 AAA contrast ratios for typography and actionable affordances.

### Palette Architecture
- **Primary (`#0078D4` - Fluent Azure Blue):** The anchor for high-intent actions, key focus rings, active selection indicator bars, and validated states.
- **Secondary (`#00A4EF` - Dynamic Cyan):** The conversational intelligence accent; communicates generative insights, processing, interactive hover gradients, and secondary highlights.
- **Tertiary (`#2EE6CA` - Kinetic Mint/Teal):** Used sparingly for telemetry sparks, active AI completion hints, and affirmative real-time streaming tags.
- **Neutral Base (`#202020` - Card Background):** Central resting point for intermediate surface layers.

### Surface Tiers & Mica Hierarchy
- **Canvas Base / Desktop Mica Layer:** `#181818` (Window frame and dormant application background).
- **Surface Level 1 (Panels / Sidebars):** `#202020` with 85% opacity over Mica backdrop filter (`blur(30px)`).
- **Surface Level 2 (Cards / Popovers / Modals):** `#2B2B2B` with 100% opacity for maximum legibility and isolation.
- **Subtle Surface (Input troughs / Table headers):** `#1E1E1E` or `rgba(255, 255, 255, 0.04)`.

### Stroke & Light Emulation
- **Stroke Default (Elevation Border):** `rgba(255, 255, 255, 0.08)` applied as an inner or centered 1px line.
- **Stroke Top-Light Accent:** `rgba(255, 255, 255, 0.14)` for top edges of elevated containers, simulating downward directional office lighting.
- **Stroke Subdued (Dividers):** `rgba(255, 255, 255, 0.05)`.

## Typography

The typographic hierarchy prioritizes systematic scan-ability, rapid information ingestion, and modern structural balance. Headlines utilize Plus Jakarta Sans to channel the geometric precision and open counters characteristic of modern enterprise operating systems, while body copy and data tables rely on Inter for optical clarity at dense scales.

### Implementation Guidelines
- **Optical Weighting:** Dark surfaces create visual irradiation (text appears slightly bolder against black than white). Hence, body copy defaults to standard `400` weight with pure whites reserved strictly for primary headings (`#FFFFFF`). Body text must use subdued luminances: Primary Body at `rgba(255, 255, 255, 0.89)`, Secondary Metadata at `rgba(255, 255, 255, 0.60)`, and Disabled/Placeholder at `rgba(255, 255, 255, 0.38)`.
- **Vertical Metronome:** All line heights align strictly with 4px intervals (`16px`, `20px`, `24px`, `28px`, `36px`, `52px`) ensuring seamless lockstep across multi-column data views.
- **Tabular Data:** When rendering numerals in financial or streaming telemetry modules, apply font feature settings `'tnum'` (tabular numbers) and `'cv05'`.

## Layout & Spacing

The layout engine uses a structured, mathematically coherent 8px grid foundation (with 4px half-steps for fine-grained alignments such as icon-to-label gaps and badge margins).

### Grid Models & Adaptive Canvas
- **Desktop (1200px+):** Fluid 12-column or asymmetrical panel architecture (e.g., 280px fixed navigation rail, 380px contextual copilot inspector pane, fluid primary canvas with `1.5rem` outer margin and `1rem` column gutters).
- **Tablet / Compact Desktop (768px – 1199px):** 8-column layout. Copilot inspector collapses into an off-canvas drawer; side rails compress to a 64px icon-only vertical shelf. Margins step down to `1.25rem`.
- **Mobile (< 768px):** 4-column single-stack flow. Outer margins calibrate to `1rem` (`16px`). Touch targets expand to a minimum 44px operational envelope, regardless of component visual boundary.

### Layout Principles
- **Density Control:** Support both Default (`space-lg` card padding, 40px row height) and Compact modes (`space-md` card padding, 32px row height) across enterprise tables.
- **Docking & Window Panes:** Spacing between top-level app bars, multi-tab bars, and client workspaces is exactly `0px`, demarcated exclusively by a `1px` structural divider (`rgba(255, 255, 255, 0.06)`).

## Elevation & Depth

Depth in this system is driven by physical realism, light simulation, and surface translucency rather than heavy cast shadows. 

### The Mica & Acrylic Paradigm
1. **Background Base (Mica Simulation):** The lowest layer (`#181818`) remains static, reflecting soft blurred color halos behind floating app surfaces.
2. **Intermediate Layer (Acrylic Surfaces):** Navigational ribbons, transient palettes, and side drawers use `background: rgba(32, 32, 32, 0.75)` with `backdrop-filter: blur(24px) saturate(140%)`.
3. **Elevated Elements (Cards, Flyouts, Panels):** Opaque surfaces (`#2B2B2B`) that sit higher on the visual z-axis.

### Dual-Layer Micro-Shadows
Cast shadows in dark mode are tinted with deep neutral-black and paired with top-lit specular strokes:
- **Resting Depth (Card, Input):** 
  - Box Shadow: `0px 1px 2px rgba(0, 0, 0, 0.24)`
  - Edge Stroke: `1px solid rgba(255, 255, 255, 0.07)`
- **Hover/Interactive Depth:** 
  - Box Shadow: `0px 4px 8px rgba(0, 0, 0, 0.32), 0px 1px 3px rgba(0, 0, 0, 0.2)`
  - Edge Stroke: `1px solid rgba(255, 255, 255, 0.12)`
- **Floating Flyout / Popover:** 
  - Box Shadow: `0px 8px 24px rgba(0, 0, 0, 0.48), 0px 2px 6px rgba(0, 0, 0, 0.24)`
  - Edge Stroke: `1px solid rgba(255, 255, 255, 0.14)`
- **Modal Dialog:** 
  - Box Shadow: `0px 24px 48px rgba(0, 0, 0, 0.64), 0px 4px 12px rgba(0, 0, 0, 0.36)`
  - Edge Stroke: `1px solid rgba(255, 255, 255, 0.18)`
- **Copilot Intelligent Glow:** Active copilot containers or focused generative outputs utilize a dual ambient halo: `0 0 0 1px #0078D4, 0 4px 20px rgba(0, 164, 239, 0.15)`.

## Shapes

The design system employs a geometric radius philosophy based on mathematical consistency (`roundedness: 2`), anchoring standard controls to `0.5rem` (8px) and large containers/modals to `0.75rem` - `1rem` (12px - 16px).

### Shape Mapping
- **Micro / Sub-controls (Checkboxes, Toggles, Tags):** `4px` (`rounded-sm`) to retain crisp box geometries when tiny.
- **Interactive Controls (Buttons, Inputs, Selectors, Tabs):** `8px` (`rounded-md` / standard). Creates a cohesive, unified horizontal cadence across toolbars.
- **Surfaces & Cards (Data widgets, Dashboard panels):** `8px` to `12px` (`rounded-lg`).
- **Modals, Dialogs & Toast Notifications:** `12px` to `16px` (`rounded-xl`).
- **Pill / Circular Tokens (Badges, Avatars, Active status pips):** `9999px` (`rounded-full`). Never use pill shapes for primary standard rectangular action buttons.

## Components

### Buttons
- **Primary:** Background `linear-gradient(180deg, #0078D4 0%, #006CBE 100%)`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#FFFFFF` font-weight `600`. Bottom highlight inset: `inset 0px 1px 0px rgba(255, 255, 255, 0.2)`. Hover: `#0086F0`. Active: `#005A9E`.
- **Secondary (Subtle Outline):** Background `rgba(255, 255, 255, 0.04)`, border `1px solid rgba(255, 255, 255, 0.08)`, text `rgba(255, 255, 255, 0.90)`. Hover: Background `rgba(255, 255, 255, 0.08)`, border `rgba(255, 255, 255, 0.16)`.
- **Copilot / Generative Button:** Background `linear-gradient(135deg, rgba(0, 120, 212, 0.2) 0%, rgba(0, 164, 239, 0.15) 100%)`, border `1px solid rgba(0, 164, 239, 0.4)`. Text `#FFFFFF`. Icon paired with dynamic sparkle glyph.

### Input Fields & Text Areas
- Resting: Background `#1E1E1E`, border `1px solid rgba(255, 255, 255, 0.08)`, border-bottom `1px solid rgba(255, 255, 255, 0.45)`. Radius: `6px`. Text: `14px`, placeholder `rgba(255, 255, 255, 0.38)`.
- Focus State: Border bottom `2px solid #0078D4`, background `#252525`. Glow: None; focus is communicated through crisp bottom-accent line transitions.

### Cards & Grouping Containers
- Base Card: Background `#2B2B2B`, radius `8px` or `12px`, border `1px solid rgba(255, 255, 255, 0.07)`, padding `1rem` to `1.5rem`.
- Copilot Response Card: Background `linear-gradient(180deg, rgba(43, 43, 43, 0.9) 0%, rgba(35, 45, 55, 0.4) 100%)`, border `1px solid rgba(0, 164, 239, 0.25)`. Includes dynamic cyan telemetry badge in the top right.

### Chips & Badges
- Filter Chip: Background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.08)`, radius `9999px`, height `28px`, text `12px`.
- Active Filter Chip: Background `rgba(0, 120, 212, 0.25)`, border `1px solid #0078D4`, text `#FFFFFF`.

### Checkboxes & Radio Controls
- Checkbox: 18x18px, radius `4px`. Unchecked: `1px solid rgba(255, 255, 255, 0.4)` on `#1E1E1E`. Checked: `#0078D4` fill with pure white Fluent tick mark.
- Radio: 18x18px circular frame with nested 8px solid `#0078D4` central dot on activation.

### Lists & Navigation Rails
- Nav Item: Height `36px`, horizontal padding `12px`, radius `6px`. Hover: `rgba(255, 255, 255, 0.05)`. Active: `rgba(255, 255, 255, 0.08)` with a vertical indicator bar on the left edge (`3px` width, `16px` height, radius `2px`, background `#0078D4`).

### Fluent Iconography Rules
- Grid: 16x16px, 20x20px, and 24x24px bounding boxes.
- Stroke: 1.5px consistent line weight with rounded caps and joins.
- Tinting: Icons match their adjoining typographic color token (`0.89` for active/prominent, `0.60` for secondary).