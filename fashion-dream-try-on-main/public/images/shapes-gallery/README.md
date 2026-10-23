# WEARO — SVG palette variants

This package contains 72 original SVGs and 216 recolored variants (288 SVG files total).

## Structure
- `originals/`: original artwork, renamed `shape-01.svg` through `shape-72.svg`
- `blue-gray-7794A6/`: variants using `#7794A6`
- `warm-cream-F2CEAE/`: variants using `#F2CEAE`
- `soft-coral-F2AD94/`: variants using `#F2AD94`
- `manifest.json`: source mapping, colors, and validation metadata

## Reference
- [Shapes Gallery](https://www.shapes.gallery/) — reference source for the SVG shape assets.

## Recoloring behavior
SVG files were parsed as XML and validated before and after editing. Explicit solid-color declarations in `fill`, `stroke`, `color`, `stop-color`, `flood-color`, `lighting-color`, and corresponding inline `style` properties were changed to the target color. `none`, `transparent`, `currentColor`, `url(...)` references, and `var(...)` values were preserved. This avoids flattening transparency and keeps referenced gradients/filters intact.

## Integration note
The SVG assets and palette variants are stored in this repository. They have not yet been integrated into the website UI. Before production use, visually inspect the assets and test selected shapes against the existing site palette and backgrounds.
