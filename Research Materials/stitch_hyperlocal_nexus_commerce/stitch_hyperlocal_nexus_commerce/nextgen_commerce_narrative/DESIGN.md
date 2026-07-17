---
name: NextGen Commerce Narrative
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5c'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdc'
  on-secondary-container: '#636360'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e4e2de'
  secondary-fixed-dim: '#c8c6c3'
  on-secondary-fixed: '#1b1c1a'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  section-gap: 80px
---

## Brand & Style

The design system is engineered to evoke a sense of "Quiet Luxury." It targets a discerning audience that values curated selection over mass-market volume. The emotional response is one of calm, reliability, and exclusivity.

The visual style is **Premium Minimalism**. It relies on an uncompromising commitment to whitespace, high-contrast monochromatic elements, and a sophisticated interplay between traditional editorial typography and modern functional layouts. Every interaction must feel intentional and deliberate, avoiding unnecessary ornamentation to let product photography and high-quality content lead the user experience.

## Colors

The palette is strictly monochromatic and neutral to ensure the "Hyperlocal" aspect feels sophisticated. 

- **Primary (Deep Onyx):** Used for typography, iconography, and high-emphasis CTA backgrounds.
- **Secondary (Soft Cream):** Utilized as an alternative section background to break up long vertical flows without the harshness of pure white.
- **Surface (White):** The foundation of the UI, providing a crisp, clean canvas for product imagery.
- **Accents (Slate & Warm Grey):** Used for secondary text, borders, and disabled states. They provide the necessary hierarchy without introducing distracting hues.

## Typography

This design system employs a "Modern Editorial" type scale. 

**Playfair Display** is used exclusively for headlines and titles to ground the brand in luxury and tradition. Use tighter tracking for larger display sizes to maintain a cohesive visual block.

**Inter** handles all functional and body text. Its neutral, systematic nature ensures that technical details (pricing, specs, shipping) are legible and unobtrusive. Use the `label-caps` style for small metadata and categories to create a rhythmic contrast against the serif headings.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. On desktop, content is contained within a 1280px center-aligned container using a 12-column grid. 

- **Vertical Rhythm:** A strict 8px baseline grid ensures alignment. Section gaps are intentionally large (80px+) to emphasize the premium, airy feel.
- **Mobile Adaptivity:** The 12-column grid collapses to a 2-column grid for product listings and a 1-column grid for text-heavy editorial content. Margins shrink to 16px to maximize screen real estate for imagery.
- **Alignment:** Use asymmetrical layouts occasionally for editorial features, but stick to a rigid grid for commerce-critical flows (checkout, search results).

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Minimalist Shadows**.

- **Depth Level 0 (Base):** Pure White (#FFFFFF) or Soft Cream (#FDFBF7) background.
- **Depth Level 1 (Cards):** Subsurface elements use a 1px border of Warm Grey (#E5E5E5) or an extremely soft shadow (Y: 4px, Blur: 20px, Opacity: 4% Black).
- **Depth Level 2 (Modals/Overlays):** Elevated elements use a slightly more defined shadow (Y: 12px, Blur: 40px, Opacity: 8% Black) and a subtle backdrop blur on the layer beneath to maintain focus.

Avoid heavy dark shadows or saturated glows. The goal is to make elements appear as if they are resting lightly on a physical surface.

## Shapes

The design system uses a **Refined Rounded** language. 

- **Base Radius (8px):** Applied to standard buttons, input fields, and small UI components.
- **Large Radius (16px):** Applied to product cards and content containers.
- **XL Radius (24px):** Used for large promotional banners or bottom sheets on mobile.

This moderate roundedness balances the "sharpness" of the minimalist aesthetic with an approachable, modern softness. All icons should use a 1.5pt to 2pt stroke weight with slightly rounded caps to match the UI.

## Components

### Buttons
- **Primary:** Solid Deep Onyx (#1A1A1A) with White text. No border.
- **Secondary:** Transparent background with 1px Deep Onyx border. 
- **Interaction:** On hover, primary buttons should have a slight opacity shift (90%); secondary buttons should fill with a faint Warm Grey tint.

### Input Fields
- Understated style: 1px Warm Grey border. On focus, the border transitions to Deep Onyx. Labels use `body-sm` in Slate Grey.

### Product Cards
- No border. Imagery should be full-bleed at the top with an 8:10 aspect ratio. Use Soft Cream backgrounds for product photography to create a "gallery" look.

### Chips & Tags
- Pill-shaped with Soft Cream background and Slate Grey text. Used for categories or filters.

### Navigation
- A "sticky" minimalist header with a transparent background that turns solid White on scroll. Use high-quality SVG iconography with a consistent stroke weight.