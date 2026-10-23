# WEARO — SVG palette variants

This package contains 72 original SVGs and 216 recolored variants (288 SVG files total).

## Structure
- `originals/`: original artwork, renamed `shape-01.svg` through `shape-72.svg`
- `blue-gray-7794A6/`: variants using `#7794A6`
- `warm-cream-F2CEAE/`: variants using `#F2CEAE`
- `soft-coral-F2AD94/`: variants using `#F2AD94`
- `manifest.json`: source mapping, colors, and validation metadata

## Recoloring behavior
SVG files were parsed as XML and validated before and after editing. Explicit solid-color declarations in `fill`, `stroke`, `color`, `stop-color`, `flood-color`, `lighting-color`, and corresponding inline `style` properties were changed to the target color. `none`, `transparent`, `currentColor`, `url(...)` references, and `var(...)` values were preserved. This avoids flattening transparency and keeps referenced gradients/filters intact.

## Integration note
These are prepared assets only. They have not been copied into or committed to the WEARO GitHub repository. Before production use, visually inspect the contact sheets and test selected assets against the existing site palette/backgrounds.
