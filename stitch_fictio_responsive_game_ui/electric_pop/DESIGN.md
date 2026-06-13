---
name: Electric Pop
colors:
  surface: '#fbf8ff'
  surface-dim: '#d9d9e7'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ededfb'
  surface-container-high: '#e7e7f5'
  surface-container-highest: '#e1e1ef'
  on-surface: '#191b25'
  on-surface-variant: '#434656'
  inverse-surface: '#2e303a'
  inverse-on-surface: '#f0effe'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#ab008f'
  on-secondary: '#ffffff'
  secondary-container: '#d600b3'
  on-secondary-container: '#fffbff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#caa900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#ffd8ee'
  secondary-fixed-dim: '#ffade2'
  on-secondary-fixed: '#3b002f'
  on-secondary-fixed-variant: '#86006f'
  tertiary-fixed: '#ffe170'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fbf8ff'
  on-background: '#191b25'
  surface-variant: '#e1e1ef'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Rubik
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.5'
  body-md:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  touch-target-min: 48px
  card-padding: 20px
---

## Brand & Style
This design system is built for high-energy social interaction, specifically tailored for the multiplayer party game environment. The brand personality is exuberant, loud, and unapologetically playful. It targets a Gen-Z and Millennial audience looking for instant engagement and "shareable" visual moments.

The aesthetic follows a **Modern Pop-Brutalist** approach: it combines the cleanliness of flat design with the aggressive energy of neon accents and thick strokes. By utilizing a pure white background as the canvas, the electric primary colors vibrate with maximum intensity, creating a "sticker-book" feel that is both nostalgic and contemporary.

## Colors
The palette is designed to be high-contrast and high-saturation to maintain legibility under the fast-paced conditions of a party game.

- **Primary (Electric Blue):** Used for main actions, navigation, and "Player 1" identifiers.
- **Secondary (Neon Pink):** Reserved for high-energy interactions, "correct" states, and "Player 2" identifiers.
- **Tertiary (Bright Yellow):** Used for warnings, highlights, currency, or "Player 3" identifiers.
- **Neutral:** A strict #000000 (Black) is used for thick borders and typography to anchor the vibrant colors against the #FFFFFF (White) base.

## Typography
The typography is the voice of this design system: loud and charismatic. 

**Bricolage Grotesque** is used for all headlines and display text. Its quirky, expressive letterforms provide the "Pop" character required for a game. For body text and functional labels, **Rubik** offers a friendly, rounded sans-serif alternative that maintains the playful theme while ensuring readability during gameplay. All important text should be rendered in heavy weights (Bold or ExtraBold) to stand up against the thick-bordered UI elements.

## Layout & Spacing
The layout follows a **Fluid Grid** model with an emphasis on "chunky" spacing. We avoid tight clusters; every interactive element needs room to breathe to prevent accidental taps during frantic gameplay.

- **Mobile:** Single column with 24px side margins.
- **Tablet/Desktop:** Multi-column layout where elements are contained in card-like blocks that reflow based on screen width.
- **Rhythm:** All spacing is based on an 8px base unit. Vertical rhythm is driven by the "Big Button" philosophy—every primary action should occupy at least 64px in height.

## Elevation & Depth
In this design system, depth is not conveyed through shadows or blurs, but through **Bold Outlines** and **Offset Planes**.

- **Level 0:** The white background.
- **Level 1:** Content cards with a 3px solid black border.
- **Level 2:** Active/Interactive elements. Instead of a shadow, use a "Hard Shadow" effect—a solid black offset block (usually 4px or 8px) placed behind the element to give it a physical, sticker-like appearance.
- **Transitions:** When pressed, elements should shift 4px down and right to "meet" their hard shadow, creating a tactile "click" sensation.

## Shapes
The shape language is dominated by extreme roundedness. The system uses a "Pill-shaped" logic for almost all buttons and labels.

- **Primary Buttons:** Fully rounded (pill).
- **Cards:** Large 2rem (32px) corners to maintain a friendly, toy-like feel.
- **Avatars:** Always perfect circles with a 3px solid black border. 
- **Strokes:** A consistent 3px or 4px black stroke must be applied to all shapes to separate them from the white background.

## Components

### Buttons
Buttons are the core of the game. They must be oversized and high-contrast.
- **Primary:** Neon Pink background, white or black text, 4px black offset shadow.
- **Secondary:** Electric Blue background, white text.
- **Success/Yellow:** Bright Yellow background, black text.

### Voting Cards
Cards used for player choices should feature a large image or text area in the center. When selected, the card's 3px border changes from Black to Neon Pink, and the card "pops" (scales up by 5%).

### Avatars
Player avatars are circular. Each player is assigned a "Neon Aura" (a 4px ring around the avatar) in their specific player color.

### Podium Elements
The end-of-game podium uses vertical pillars of varying heights.
- **1st Place:** Electric Blue pillar, tallest, with a gold star icon.
- **2nd Place:** Neon Pink pillar.
- **3rd Place:** Bright Yellow pillar.
Each pillar features a heavy 4px black outline to pop against the white background.

### Input Fields
Inputs are pill-shaped with a thick black border. When focused, the border color switches to Electric Blue and the background turns slightly off-white to indicate active status.