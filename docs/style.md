# Style Guide

## Type Scale

Minor-third progression (1.200), base 16px:
- **xs:** 16px
- **sm:** 19px
- **md:** 23px
- **lg:** 28px
- **xl:** 33px
- **2xl:** 40px

## Spacing Scale

4px base:
- 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## Colour Tokens

Light mode palette using system fonts.

### Token Definitions

- `--bg`: #ffffff (background)
- `--fg`: #1a1a1a (foreground text)
- `--muted`: #666666 (muted/secondary text)
- `--accent`: #0066cc (interactive, links, accents)
- `--border`: #666666 (borders, dividers)

### Contrast Verification

All text/UI pairs meet WCAG AA accessibility standards:

| Token Pair | Contrast Ratio | Minimum Required | Status |
|---|---|---|---|
| `--fg` (#1a1a1a) on `--bg` (#ffffff) | 18:1 | 4.5:1 | ✓ |
| `--muted` (#666666) on `--bg` (#ffffff) | 5.4:1 | 4.5:1 | ✓ |
| `--accent` (#0066cc) on `--bg` (#ffffff) | 5.4:1 | 3:1 | ✓ |
| `--border` (#666666) on `--bg` (#ffffff) | 5.4:1 | 3:1 | ✓ |

## System Font Stack

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

Fallback order: system font, Apple San Francisco, Chrome/Edge system font, Windows Segoe UI, cross-platform Roboto, Windows Helvetica Neue, generic sans-serif.
