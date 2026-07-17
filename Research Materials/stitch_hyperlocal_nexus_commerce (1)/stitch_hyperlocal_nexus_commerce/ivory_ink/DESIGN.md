---
name: Ivory & Ink
colors:
  surface: '#fef9f2'
  surface-dim: '#ded9d3'
  surface-bright: '#fef9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ec'
  surface-container: '#f2ede6'
  surface-container-high: '#ece7e1'
  surface-container-highest: '#e6e2db'
  on-surface: '#1d1c18'
  on-surface-variant: '#444748'
  inverse-surface: '#32302c'
  inverse-on-surface: '#f5f0e9'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#655d54'
  on-secondary: '#ffffff'
  secondary-container: '#ede1d4'
  on-secondary-container: '#6b6359'
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
  secondary-fixed: '#ede1d4'
  secondary-fixed-dim: '#d0c5b9'
  on-secondary-fixed: '#201b13'
  on-secondary-fixed-variant: '#4d463d'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fef9f2'
  on-background: '#1d1c18'
  surface-variant: '#e6e2db'
typography:
  display-xl:
    fontFamily: Playfair Display
    fontSize: 72px
    fontWeight: '600'
    lineHeight: 84px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Playfair Display
    fontSize: 60px
    fontWeight: '600'
    lineHeight: 72px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-sm:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  max-width: 1440px
  columns: '12'
  gutter: 32px
  margin: 64px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
  unit-xl: 64px
  unit-xxl: 128px
---

## Brand & Style
The brand personality is authoritative yet welcoming, embodying a "New Heritage" aesthetic that blends classical editorial prestige with modern digital clarity. The target audience includes discerning professionals and high-net-worth individuals who value intentionality over trendiness.

This design system utilizes a **Minimalist-Luxury** style. It relies on extreme whitespace, precise typographic hierarchies, and a restrained color palette to evoke a sense of calm, focus, and premium quality. The emotional response should be one of "quiet confidence"—where the interface recedes to let the content command attention.

## Colors
The palette is rooted in high-contrast legibility and natural warmth.

- **Primary (Charcoal):** Used for all primary body text, headlines, and foundational iconography. It is a deep, softened black that prevents the harshness of pure hex black against the cream background.
- **Secondary (Taupe):** A sophisticated mid-tone used for secondary labels, metadata, and subtle borders. It provides a bridge between the dark text and light background.
- **Neutral (Ivory):** The foundational surface color. This off-white provides a warmer, more "paper-like" feel than a standard white screen, reducing eye strain for long-form reading.
- **Accent:** Functional states (like success or errors) should use desaturated, "ink-like" versions of green or red to maintain the editorial integrity.

## Typography
The typography is the core of the identity. We pair the high-contrast elegance of **Playfair Display** for headlines with the exceptional readability of **Source Serif 4** for body content. 

For functional UI elements, **Hanken Grotesk** provides a sharp, modern counterpoint, ensuring clarity in navigation and labels. On desktop, we utilize a "Display" tier for landing pages and editorial features, allowing for massive, impactful type that takes advantage of larger screen real estate. Use tight tracking for large display type and generous leading for body text to ensure a luxurious reading experience.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid Grid**. On desktop, content is centered within a 1440px container using a 12-column grid. 

- **Gutter & Margin:** We use wide 32px gutters and 64px outer margins to enforce the feeling of an open art gallery or a high-end magazine.
- **Vertical Rhythm:** Spacing between sections should be aggressive (typically 128px) to allow content to breathe.
- **Alignment:** While text is primarily left-aligned for readability, featured quotes or headers may be center-aligned to break the grid and create visual interest.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows. 

- **Layers:** Most content sits flat on the Ivory surface. For modals or pop-overs, use a slightly lighter Ivory tint or a very soft, high-diffusion shadow (0% offset, 40px blur, 4% opacity Charcoal).
- **Borders:** Use 1px solid borders in the Secondary (Taupe) color at 20-30% opacity to define zones without breaking the visual flow.
- **Glassmorphism:** Reserved exclusively for sticky navigation bars. Use a heavy backdrop blur (20px) with 80% opacity Ivory to maintain the "ink on paper" feel while allowing content to scroll underneath.

## Shapes
The design system uses a **Sharp (0px)** roundedness philosophy. 

This reinforces the architectural and editorial nature of the design. Buttons, input fields, and card containers all feature crisp 90-degree corners. This evokes the edges of a printed book or a framed photograph. Circular shapes are permitted only for specific iconography or avatar masks to provide a singular point of organic contrast.

## Components
- **Buttons:** Primary buttons are solid Charcoal with Ivory text. Secondary buttons are ghost-style with a 1px Charcoal border. On hover, buttons should feature a slight color shift (to a dark taupe) or a subtle "lift" via a hairline shadow.
- **Inputs:** Simple bottom-border only (1px Taupe) or full-frame with 1px borders. Focused states should darken the border to solid Charcoal. Labels should use the `label-sm` style.
- **Cards:** Cards should not have shadows. Use 1px borders or simple background color shifts. All cards must have generous internal padding (min 32px).
- **Navigation:** The desktop header should be minimalist, using `label-md` for links with a 1px underline that appears on hover.
- **Hover States:** Transitions must be slow and elegant (300ms ease-out). Use "reveal" animations—such as a subtle opacity increase or a hairline border growth—to signal interactivity without being flashy.
- **Lists:** Use custom bullet points (small squares or dashes) in the Secondary color to align with the geometric shape language.