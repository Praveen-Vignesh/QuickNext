---
name: Ivory & Ink
colors:
  surface: '#fef9f2'
  surface-dim: '#ded9d3'
  surface-bright: '#fef9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ec'
  surface-container: '#f2ede7'
  surface-container-high: '#ece7e1'
  surface-container-highest: '#e7e2db'
  on-surface: '#1d1b18'
  on-surface-variant: '#444748'
  inverse-surface: '#32302c'
  inverse-on-surface: '#f5f0ea'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#5e5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdb'
  on-secondary-container: '#63635f'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c18'
  on-tertiary-container: '#86837e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e4e2dd'
  secondary-fixed-dim: '#c8c6c2'
  on-secondary-fixed: '#1b1c19'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#e6e2dc'
  tertiary-fixed-dim: '#cac6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#484742'
  background: '#fef9f2'
  on-background: '#1d1b18'
  surface-variant: '#e7e2db'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  subheading-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.15em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 80px
  margin-mobile: 24px
  section-gap: 120px
---

## Brand & Style

The design system is rooted in the philosophy of "Quiet Luxury"—a blend of high-end editorial aesthetics and modern minimalism. It targets a discerning audience that values heritage, precision, and understated elegance. The UI should evoke a sense of calm authority, resembling a curated boutique experience or a premium fashion periodical.

The style is characterized by a sophisticated interplay of expansive whitespace and rigorous typographic hierarchy. It avoids loud decorative elements, relying instead on the "royal" quality of its materials: ivory surfaces, charcoal inks, and razor-thin hairlines. The emotional response is one of confidence, exclusivity, and timelessness.

## Colors

The palette is intentionally restrained to maintain a high-fashion, editorial feel. 

- **Primary (Ink):** A deep charcoal (#1A1A1A) used for primary text and structural elements. It provides better legibility and a softer "royal" feel than a true pitch black.
- **Secondary (Bone):** The foundational surface color (#F9F7F2). This deepened ivory provides a warm, tactile quality reminiscent of heavy-weight archival paper.
- **Tertiary (Stone):** A warm, muted grey (#D1CDC7) used for subtle borders and disabled states.
- **Neutral (Smoke):** A mid-tone grey (#73706B) used exclusively for secondary metadata and captions.

Avoid gradients or vibrant accents. Contrast is achieved through typographic weight and generous whitespace rather than color.

## Typography

Typography is the primary vehicle for the brand’s "royal" aesthetic. 

- **Playfair Display** is used for all headlines and display moments. It should be typeset with a slightly tighter tracking in large sizes to emphasize its elegant serifs and high contrast.
- **Manrope** serves as the functional workhorse. Its modern, geometric construction provides a clean counterpoint to the traditional serif.
- **Subheadings** must use the `subheading-caps` style: uppercase with significant tracking (0.15em) to create a sense of premium airiness.

Line heights are generous to ensure the text feels uncrowded and "expensive."

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model with extreme emphasis on "breathing room." 

- **Desktop:** A 12-column grid with a maximum width of 1280px. Margins are intentionally wide (80px) to frame the content like a page in a luxury magazine.
- **Sectioning:** Vertical rhythm is sparse. Use `section-gap` (120px) between major content blocks to prevent the UI from feeling utilitarian.
- **Internal Spacing:** Use an 8px base unit. Component padding should err on the side of being oversized rather than cramped.

The goal is to move away from information density toward a focused, singular narrative flow.

## Elevation & Depth

This design system avoids traditional shadows in favor of **Tonal Layers** and **Minimal Hairlines**.

- **Surfaces:** Use slight variations of the Bone background to signify depth. Elevated panels (like cards) should use the same color as the background but be defined by a 0.5px hairline border in `Tertiary (Stone)`.
- **Shadows:** When absolute necessity for depth arises (e.g., a floating menu), use a "Whisper Shadow": `0px 12px 32px rgba(26, 26, 26, 0.04)`. It should be barely perceptible, serving as a soft ambient glow rather than a structural element.
- **Focus:** Depth is created by "layering" text over white space, not by stacking blocks.

## Shapes

The design system employs **Sharp (0px)** roundedness across all primary elements. 

The use of 90-degree angles conveys a sense of architectural structure, precision, and formality. This sharpness applies to buttons, input fields, images, and cards. Round elements (like icons or specific decorative imagery) should be used sparingly as focal points to break the geometric rigor.

## Components

- **Buttons:** Primary buttons are solid Charcoal with White text, sharp corners, and no shadow. Secondary buttons use a 0.5px border with no fill. Padding should be tall (e.g., 16px 32px).
- **Inputs:** Simple bottom-border only (1px Stone) or a full sharp-edged box with a 0.5px border. Labels should use the `subheading-caps` style.
- **Cards:** No shadows. Defined by 0.5px borders or simply by generous whitespace and typographic alignment.
- **Lists:** Separated by 0.5px Stone hairlines. Increase the vertical padding between list items to at least 24px.
- **Chips/Tags:** Sharp edges, 0.5px border, using `label-sm` typography. Avoid background fills unless indicating a "Selected" state.
- **Navigation:** Minimalist text-only links with wide horizontal spacing. Current page indicator should be a simple 1px underline.