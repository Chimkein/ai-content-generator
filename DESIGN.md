---
name: AI Content Gen
description: Personal AI content generator for social media captions and teaser images
colors:
  indigo-primary: "oklch(0.55 0.24 275)"
  indigo-primary-dark: "oklch(0.7 0.2 275)"
  paper-light: "oklch(0.985 0.002 280)"
  paper-dark: "oklch(0.13 0.015 275)"
  card-light: "oklch(1 0 0)"
  card-dark: "oklch(0.18 0.015 275)"
  text-strong-light: "oklch(0.16 0.01 280)"
  text-strong-dark: "oklch(0.93 0.005 275)"
  text-muted-light: "oklch(0.50 0.01 280)"
  text-muted-dark: "oklch(0.65 0.01 275)"
  surface-muted-light: "oklch(0.955 0.01 280)"
  surface-muted-dark: "oklch(0.22 0.015 275)"
  border-light: "oklch(0.91 0.01 280)"
  border-dark: "oklch(0.26 0.02 275)"
  destructive-light: "oklch(0.577 0.245 27.325)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "calc(0.75rem * 0.6)"
  md: "calc(0.75rem * 0.8)"
  lg: "0.75rem"
  xl: "calc(0.75rem * 1.4)"
spacing:
  card: "1rem"
  card-sm: "0.75rem"
  section: "1.5rem"
  page-x: "1rem"
  page-x-sm: "1.5rem"
  page-x-lg: "2rem"
  page-y: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.indigo-primary}"
    textColor: "oklch(0.99 0 0)"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "oklch(0.55 0.24 275 / 0.8)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  card-default:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card}"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
---

# Design System: AI Content Gen

## Overview

**Creative North Star: "The Indigo Engine"**

Quiet power under the hood. The interface is calm, measured, and restrained — the AI does the heavy lifting. Every surface exists to get out of the way and let the generated content take center stage. The system uses a single indigo accent as its voice: present enough to guide, rare enough to matter.

The palette is built entirely in OKLCH, giving consistent perceptual lightness across light and dark modes. Both themes share the same hue channel (275°) with chroma and lightness shifted to maintain contrast. Cards float on a near-white or deep-charcoal ground. Typography pairs geometric Sora for headings with humanist Outfit for body — a technical-meets-approachable pairing that reads as modern without being cold.

Density is medium. Cards carry generous internal padding (1rem), sections are spaced with 1.5rem gaps, and the main content column is capped at `max-w-4xl` (56rem). Interactions are refined and restrained: subtle border shifts on hover, gentle press animations (`scale(0.97)`), and staggered fade-in-up entrance animations that unfold the page progressively.

**Key Characteristics:**
- Single-accent indigo system with OKLCH color space
- Refined, restrained interactions — no bold hover effects or dramatic state changes
- Content-forward: generated captions and images are always the visual protagonist
- Staggered entrance animations create a sense of progressive disclosure
- Consistent card-based layout across all app pages

## Colors

The palette orbits a single indigo accent, with all colors sharing the 275° hue channel. Neutrals carry a faint indigo tint that unifies the palette without competing with content.

### Primary
- **Indigo Engine** (oklch(0.55 0.24 275) light / oklch(0.7 0.2 275) dark): The sole accent. Used for primary buttons, active states, focus rings, selected borders, and the sidebar's brand mark. In dark mode, lightness shifts from 0.55 to 0.7 to maintain contrast against the dark ground.

### Neutral
- **Paper** (oklch(0.985 0.002 280) light / oklch(0.13 0.015 275) dark): Page background. Near-white with a whisper of blue-gray warmth.
- **Card Surface** (oklch(1 0 0) light / oklch(0.18 0.015 275) dark): Card and popover backgrounds. Pure white in light mode; a step lighter than the page in dark mode.
- **Text Strong** (oklch(0.16 0.01 280) light / oklch(0.93 0.005 275) dark): Primary text and headings.
- **Text Muted** (oklch(0.50 0.01 280) light / oklch(0.65 0.01 275) dark): Secondary text, descriptions, labels, and placeholder text.
- **Surface Muted** (oklch(0.955 0.01 280) light / oklch(0.22 0.015 275) dark): Muted backgrounds, secondary button fills, card footers.
- **Border** (oklch(0.91 0.01 280) light / oklch(0.26 0.02 275) dark): Card outlines, input borders, dividers.
- **Destructive** (oklch(0.577 0.245 27.325) light / oklch(0.704 0.191 22.216) dark): Error states and destructive actions. Used at 10-20% opacity for backgrounds, full strength for text.

### Named Rules
**The One Accent Rule.** Indigo is the only chromatic color in the system. Every other color is a tinted neutral. This constraint keeps the interface quiet and lets generated content — which is colorful and unpredictable — remain the visual focus.

## Typography

**Display Font:** Sora (with sans-serif fallback)
**Body Font:** Outfit (with sans-serif fallback)

**Character:** Sora's geometric precision gives headings a technical edge; Outfit's open, humanist shapes make body text feel approachable and easy to scan. The pairing reads as "smart tool, friendly interface."

### Hierarchy
- **Display** (700, clamp(2.5rem, 5vw, 3.75rem), 1.1): Landing page hero headline only.
- **Headline** (700, 1.5rem, 1.2): Page titles ("Create Content", "Generated Content", "History").
- **Title** (500, 1rem, 1.4): Card titles, section headers, modal headings. Uses Sora via `font-heading`.
- **Body** (400, 0.875rem, 1.5): All body text, form labels, descriptions, generated captions. Uses Outfit via `font-sans`.
- **Label** (500, 0.75rem, 1.4): Badges, chip text, small metadata, model descriptions.

### Named Rules
**The Heading Font Rule.** Only `<h1>`–`<h6>` and elements with `font-heading` use Sora. Everything else uses Outfit. No exceptions, no mixing within a text block.

## Layout

The app uses a sidebar + main content layout. The sidebar is fixed-width on desktop and collapses to a hamburger overlay on mobile. Main content scrolls independently within a centered column:

- **Max width:** 56rem (`max-w-4xl`)
- **Horizontal padding:** 1rem mobile, 1.5rem tablet (`sm:`), 2rem desktop (`lg:`)
- **Vertical padding:** 4.5rem top (clearing mobile header), 2rem bottom on desktop
- **Section gap:** 1.5rem (`space-y-6`) between cards/sections
- **Card internal padding:** 1rem (`--card-spacing: --spacing(4)`), 0.75rem for small cards
- **Grid patterns:** 3-column for content type selector, 2-column for image grids, 1-3 column responsive for caption model cards

Content is single-column by design. No multi-column dashboards or complex grid layouts. This keeps the mobile experience identical to desktop in structure, only narrower.

## Elevation & Depth

The system is flat by default. Cards use a `ring-1 ring-foreground/10` outline instead of shadows — a tonal border that disappears into the background without lifting the surface. Depth is conveyed through layering and opacity, not shadows.

The only shadow in the system is on hover: `.card-hover:hover` applies `box-shadow: 0 8px 25px -5px oklch(0 0 0 / 0.1)` plus a 1px indigo ring. This is used sparingly on the landing page feature cards, not in the app UI.

### Named Rules
**The Flat-By-Default Rule.** App surfaces are flat at rest. The single hover shadow on the landing page is the exception, not a pattern to extend. In the app, state changes are communicated through border color, background tint, and opacity — never elevation.

## Shapes

Corners are gently curved throughout, derived from a base `--radius` of `0.75rem` with multipliers:

- **Small** (0.45rem): Inner elements, nested controls
- **Medium** (0.6rem): Inputs, small buttons
- **Large** (0.75rem): Standard buttons, inputs, badges — the default
- **Extra-large** (1.05rem): Cards, modals, image containers
- **Full** (9999px): Pills, the landing page chip badge

Border language is restrained: 1px borders using the `border` token, with `ring-1 ring-foreground/10` on cards for a softer-than-border outline. Selected states swap the border to `border-primary`. No double borders, no dashed lines, no decorative strokes.

## Components

### Buttons
- **Shape:** Gently rounded (0.75rem radius), `h-8` default height
- **Primary:** Indigo fill, white text. Hover reduces opacity to 80%. Focus shows a 3px indigo ring at 50% opacity.
- **Hover / Focus:** All variants use `transition-all` for smooth state changes. Active state applies `scale(0.97)` via `.btn-press`.
- **Outline:** Transparent fill, border from `border` token. Hover fills with `muted` background. Dark mode uses `input/30` background.
- **Ghost:** No border, no fill. Hover fills with `muted`. Used for icon-only actions (close, dismiss).
- **Destructive:** 10% destructive background tint, destructive text color. Hover deepens to 20%.

### Cards / Containers
- **Corner Style:** Extra-large radius (1.05rem / `rounded-xl`)
- **Background:** Card surface token (white light / charcoal dark)
- **Shadow Strategy:** None. Uses `ring-1 ring-foreground/10` outline.
- **Border:** Tonal ring, not a hard border
- **Internal Padding:** 1rem via CSS variable `--card-spacing`

### Inputs / Fields
- **Style:** Transparent background, 1px border from `border` token, rounded-lg corners
- **Focus:** Border shifts to `ring` (indigo), 3px ring at 50% opacity
- **Error:** Border and ring shift to `destructive` token
- **Disabled:** 50% opacity, `input/50` background tint

### Navigation (Sidebar)
- **Desktop:** Fixed sidebar with brand mark, nav links, user avatar, theme toggle, and sign-out. Active link has indigo background tint and indigo text.
- **Mobile:** Hamburger icon in top-left, full-screen overlay with backdrop blur. Same nav items, closes on navigation.
- **Typography:** Body weight (400) for nav labels, with Sora headings for the brand mark.

### Selection Controls (Signature Component)
A recurring pattern across the app: grid-based toggle buttons for content type, caption model, image model, image source, aspect ratio, and image count. Each is a `<button>` with:
- Default: `border-border text-muted-foreground`
- Selected: `border-primary bg-primary/5 text-primary`
- Hover: `hover:border-muted-foreground/50 hover:bg-muted/30`
- Press: `scale(0.97)` via `.btn-press`

This pattern replaces traditional radio groups and select dropdowns with a more visual, direct-manipulation interface.

## Do's and Don'ts

### Do:
- **Do** use oklch for all color definitions — the entire palette is in OKLCH and must stay there for perceptual consistency.
- **Do** use the selection control pattern (grid of toggle buttons) for any new setting with 2-8 discrete options.
- **Do** add stagger classes (`stagger-1` through `stagger-8`) to page sections for progressive entrance animation.
- **Do** use Phosphor Icons exclusively — the project has removed all other icon libraries.
- **Do** keep the content column at `max-w-4xl` with consistent horizontal padding across breakpoints.

### Don't:
- **Don't** introduce a second chromatic accent. The One Accent Rule keeps generated content as the visual focus.
- **Don't** add box-shadows to app UI cards or surfaces. Use `ring-1 ring-foreground/10` instead.
- **Don't** use Lucide, Heroicons, or any icon library other than `@phosphor-icons/react`.
- **Don't** use hex or hsl colors — all tokens are oklch and conversions break the perceptual consistency.
- **Don't** add gradient text to any element. The landing page's existing gradient heading is flagged for removal.
