---
name: Luminescent Precision
colors:
  surface: '#0b141c'
  surface-dim: '#0b141c'
  surface-bright: '#313a43'
  surface-container-lowest: '#060f16'
  surface-container-low: '#141c24'
  surface-container: '#182028'
  surface-container-high: '#222b33'
  surface-container-highest: '#2d363e'
  on-surface: '#dae3ee'
  on-surface-variant: '#c1c6d6'
  inverse-surface: '#dae3ee'
  inverse-on-surface: '#29313a'
  outline: '#8b919f'
  outline-variant: '#414753'
  surface-tint: '#aac7ff'
  primary: '#aac7ff'
  on-primary: '#002f65'
  primary-container: '#418fff'
  on-primary-container: '#002959'
  inverse-primary: '#005cba'
  secondary: '#d5bbff'
  on-secondary: '#41008b'
  secondary-container: '#5a21ab'
  on-secondary-container: '#c6a5ff'
  tertiary: '#67df70'
  on-tertiary: '#00390d'
  tertiary-container: '#27a640'
  on-tertiary-container: '#00320a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#ecdcff'
  secondary-fixed-dim: '#d5bbff'
  on-secondary-fixed: '#270058'
  on-secondary-fixed-variant: '#5a21ab'
  tertiary-fixed: '#83fc89'
  tertiary-fixed-dim: '#67df70'
  on-tertiary-fixed: '#002105'
  on-tertiary-fixed-variant: '#005317'
  background: '#0b141c'
  on-background: '#dae3ee'
  surface-variant: '#2d363e'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
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
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system synthesizes three contemporary design paradigms into an ultra-premium flagship experience:
- **Apple's Optical Realism:** Frosted optical glass (`backdrop-filter`), delicate micro-borders, and disciplined typographical rhythm.
- **Google's Fluid Adaptability:** Dynamic tonal relationships, natural surface-to-content nesting, and organic, rounded-pill interaction points.
- **Microsoft's Material Depth:** Translucent Mica-like layered panels, structured spatial discipline, and directional ambient luminosity.

The interface targets creators, executives, and technical visionaries who demand peak software craft. The atmospheric response is focused, opulent, and calm—characterized by deep graphite voids contrasted against luminous cobalt and violet light engines.

## Colors

The palette establishes an ultra-refined dark atmosphere anchored in deep graphite and oceanic slate, energized by controlled radiant highlights:

- **Canvas & Surface System:**
  - Base Obsidian: `#090d12` (root background)
  - Deep Canvas: `#0d1117` (primary app surface)
  - Mica Surface Layer: `rgba(22, 27, 34, 0.72)` (primary translucent container)
  - Raised Panel: `rgba(33, 38, 45, 0.65)` (cards, popovers, navigation rails)
  - Active Surface: `rgba(48, 54, 61, 0.55)` (interactive, hover, pressed states)

- **Luminescent Accents:**
  - Primary Electric Cobalt (`#388bfd`): Primary actions, active focus rings, and high-priority states.
  - Secondary Radiant Violet (`#a371f7`): Highlights, secondary indicators, and accent gradients.
  - Success Aurora Emerald (`#3fb950`): Positive telemetry and confirmation states.

- **Content & Micro-borders:**
  - Text Primary: `#f0f6fc` (96% contrast ratio against deep canvas)
  - Text Secondary: `#8b949e` (muted labels, secondary descriptors)
  - Text Tertiary: `#6e7681` (placeholders, disabled hints)
  - Luminous Border: `rgba(240, 246, 252, 0.08)` (resting borders)
  - Radiant Border: `rgba(56, 139, 253, 0.35)` (focused or prominent edges)

## Typography

The typography pairings strike an equilibrium between organic geometry and structural clarity:
- **Headlines:** Set in `Plus Jakarta Sans`, featuring subtle geometric curves, open counters, and tight negative letter-spacing for high-impact presence.
- **Body & Controls:** Set in `Inter` to deliver systematic metric consistency, pristine pixel fitting, and superior legibility across all screen densities.
- **Numeric & Data Values:** Enable tabular lining figures (`font-variant-numeric: tabular-nums`) across all metrics, charts, tables, and financial/technical readouts.

## Layout & Spacing

The layout model is governed by a responsive 12-column fluid grid system pinned inside a max-width container of `1440px`:
- **Desktop (≥1024px):** 12 columns, `1.5rem` (`24px`) gutters, `2rem` (`32px`) canvas margin.
- **Tablet (768px – 1023px):** 8 columns, `1rem` (`16px`) gutters, `1.5rem` (`24px`) canvas margin.
- **Mobile (<768px):** 4 columns, `0.75rem` (`12px`) gutters, `1rem` (`16px`) canvas margin.

Spacing rhythm strictly operates on an 8-point geometric scale (with a 4px sub-step for micro component padding). Layouts prioritize generous breathing room between content clusters to maintain a refined, flagship aesthetic.

## Elevation & Depth

Visual hierarchy uses a hybrid composition of frosted optical glass, ambient back-glows, and light-reactive borders:

1. **Backdrop Blurring:** Floating cards, headers, and surfaces incorporate `backdrop-filter: blur(20px) saturate(180%)`, diffusing underlying elements with Apple-grade fidelity.
2. **Layered Boundaries (Mica Edge):** Borders never use solid flat colors. Instead, they utilize a `1px` gradient stroke transitioning from top-left `rgba(255, 255, 255, 0.14)` to bottom-right `rgba(255, 255, 255, 0.02)`.
3. **Ambient Light Emissions:**
   - **Level 0 (Flat):** No shadow, pure translucent background.
   - **Level 1 (Card/Container):** `0 4px 20px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.06)`.
   - **Level 2 (Dropdown/Hover):** `0 12px 32px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 139, 253, 0.12)`.
   - **Level 3 (Modal/Sheet):** `0 24px 64px rgba(0, 0, 0, 0.7), 0 0 48px rgba(163, 113, 247, 0.15)`.

## Shapes

The shape architecture marries Apple's continuous-corner squircle feel with Google Material You's pill-forward interaction affordances:
- **Small Interactive Controls (Pills):** Chips, tags, primary badges, and key call-to-action buttons use full pill rounding (`border-radius: 9999px`).
- **Standard UI Elements:** Text inputs, dropdowns, and button groups use `rounded` (`0.5rem` / `8px`).
- **Surface Containers:** Cards and contextual panels use `rounded-lg` (`1rem` / `16px`).
- **Overlays & Dialogs:** Modals, sheets, and elevated overlays use `rounded-xl` (`1.5rem` / `24px`).

## Components

- **Buttons:**
  - *Primary:* Pill-shaped (`rounded-full`), luminous gradient fill (`linear-gradient(135deg, #388bfd, #2b6ad0)`), text in `#ffffff`, accompanied by an active ambient glow (`box-shadow: 0 0 20px rgba(56, 139, 253, 0.35)`).
  - *Secondary / Glass:* Frosted dark surface (`rgba(255, 255, 255, 0.05)`), border `1px solid rgba(255, 255, 255, 0.1)`, hover brightness escalation (`rgba(255, 255, 255, 0.09)`).
  - *Ghost:* Borderless, pure text with background tint appearing only on cursor hover (`rgba(56, 139, 253, 0.1)`).

- **Cards & Surfaces:**
  - Constructed using translucent glass foundations (`rgba(22, 27, 34, 0.72)`) with `backdrop-filter: blur(20px)`.
  - Framed by a subtle top-lit micro-border: `1px solid rgba(255, 255, 255, 0.08)`.
  - Internal padding defaults to `space-lg` (`1.5rem`).

- **Input Fields:**
  - Background set to `rgba(13, 17, 23, 0.6)`.
  - Resting border: `1px solid rgba(240, 246, 252, 0.1)`.
  - Focus state: Border transitions to `#388bfd` coupled with a soft focus ring (`box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.25)`).
  - Labels use `label-md` seated `0.5rem` above the input or floating seamlessly within.

- **Chips & Status Tags:**
  - Pill geometry (`rounded-full`), horizontal padding `space-sm` to `space-md`.
  - Subtle semi-opaque color fills: `rgba(56, 139, 253, 0.12)` for info, `rgba(63, 185, 80, 0.12)` for success.
  - Border matched to tint color at `20%` opacity.

- **Checkboxes & Radios:**
  - Resting box: `18px` width/height, `rounded-sm` for checkboxes, circular for radios; background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.2)`.
  - Checked state: Vibrant `#388bfd` fill with crisp white checkmark or inner dot; micro-glow shadow.

- **List Items & Navigation Tiles:**
  - Interactive rows with smooth transitions (`transition: background 150ms cubic-bezier(0.16, 1, 0.3, 1)`).
  - Hover state applies `rgba(255, 255, 255, 0.04)` fill with `rounded-md` corners and subtle `1px` translation along the inline axis.