# Reclaim Design System v1

Reclaim's product UI is built around agency, calm, and honest progress. It should feel deliberate and personal without looking clinical, gamified, or shame-driven.

## Brand idea

**My life belongs to me.**

The open violet path is the core brand mark: a loop with a deliberate way out. It represents agency rather than perfection.

## Visual character

- Near-black canvas, not pure black.
- Violet is the primary brand/action color.
- White is for readable foreground content, not the brand accent.
- Surfaces should create quiet depth rather than a wall of identical cards.
- Prefer one clear hero surface plus flatter supporting sections.
- Avoid card-inside-card compositions where a divider or simple row is enough.
- Use success/warning/danger colors only when they carry semantic meaning.
- Do not use smoking-cessation guilt imagery, red alarm styling, or “failure” language for ordinary progress states.

## Core palette

Defined in `src/theme/tokens.ts`.

- Canvas: `#09090D`
- Raised canvas: `#0E0D13`
- Surface: `#121118`
- Raised surface: `#181620`
- Violet accent: `#A855F7`
- Violet highlight: `#C084FC`
- Violet soft surface: `#261437`
- Primary text: `#F8F6FC`
- Secondary text: `#AAA5B4`

Use the token module instead of hard-coding new colors in product screens.

## Typography hierarchy

Use `AppText` variants rather than raw text styles whenever possible.

- **display** — primary screen statement.
- **headline** — major metric or secondary hero.
- **title** — card/row heading.
- **body** — normal explanation.
- **caption** — supporting metadata.
- **micro** — compact uppercase-style section labels.

Micro labels commonly use `tone="accent"` for the active/hero section and `tone="tertiary"` for neutral section labels.

## Surfaces

`Card` supports semantic tones:

- `default` — normal grouped content.
- `raised` — stronger separation or interactive content.
- `accent` — the one thing Reclaim wants the user to notice now.
- `success` — a genuine progress moment or achieved state.
- `danger` — destructive/privacy-critical controls only.
- `flat` — explanatory/footer content that should not add another box.

Do not make every section an accent card.

## Buttons

`Button` supports:

- `primary` — one principal action in the current context.
- `secondary` — useful alternate action.
- `ghost` — low-pressure or reversible action.
- `danger` — permanent destructive action.

Avoid multiple primary buttons stacked together unless the actions genuinely have equal priority.

## Navigation

The main tab bar uses:
- violet active state;
- quiet tertiary inactive state;
- a small active path marker;
- platform-aware bottom padding/height.

Nested screens use `BackButton` rather than ad-hoc text back links.

## Inputs and selectors

Inputs use a raised neutral background. Focus introduces the violet accent surface/border.

Native selectors should retain platform behavior:
- iOS page sheets/compact date pickers where already supported;
- Android dialog date picker/back behavior;
- shared Reclaim colors and typography around the native controls.

## Screen composition

Preferred order:

1. Small accent eyebrow.
2. Clear display statement.
3. One short secondary explanation.
4. Primary context/hero.
5. Supporting information.
6. Low-emphasis explanatory/footer content.

The Today screen is the benchmark for overall hierarchy.

## Motion and haptics

v1 should stay restrained.

- Prefer native pressed states, platform transitions, and lightweight feedback.
- Do not add constant ambient animation.
- Craving tools may animate only when animation is part of the tool itself.
- Milestones can receive subtle future motion/haptics, but progress must remain understandable without them.
- Respect reduced-motion accessibility if richer motion is introduced later.

## Platform behavior

iPhone and Android share the same identity and information architecture. They do not need to be pixel-identical.

Keep:
- native Android back behavior;
- native notification permission behavior;
- native date/dialog conventions;
- iOS widget conventions;
- platform safe areas and bottom-bar spacing.

## Accessibility

Visual polish may not reduce:
- text scaling support;
- contrast;
- 44–48pt-equivalent interaction targets;
- screen-reader labels/state;
- live announcements for errors and status changes.

Violet is an accent, not the only way to communicate a state.

## Product-language guardrails

Prefer:
- “your pace”
- “honest log”
- “pattern”
- “support”
- “one small step”
- “reclaimed”

Avoid:
- “failed”
- “bad day”
- “you broke your streak”
- shame or punishment
- unsupported medical claims
- arbitrary scores for emotional state

## Review checklist for new screens

Before merging a new UI:
- Does it have one clear visual priority?
- Is violet being used intentionally rather than everywhere?
- Can a flat section replace one of the cards?
- Are primary/secondary/destructive actions visually distinct?
- Does the screen still make sense with large text?
- Does Android back behavior remain native?
- Is the copy consistent with Reclaim's non-shaming voice?
