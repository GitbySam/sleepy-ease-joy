## Goal
Remove every reference to "silk" (and its translations "soie" / "seda") from the site copy.

## Changes — `src/i18n/translations.ts`

1. **Line 409-411** (bundle description):
   - EN: "The full ritual: pillow, **sleep** mask and pressure-sensitive earplugs..."
   - FR: "Le rituel complet : oreiller, **masque de sommeil** et bouchons d'oreilles..."
   - ES: "El ritual completo: almohada, **antifaz** y tapones..."

2. **Line 439** (`bundles.item.mask`):
   - EN: "Sleep mask"
   - FR: "Masque de sommeil"
   - ES: "Antifaz para dormir"

No other files contain the term.
