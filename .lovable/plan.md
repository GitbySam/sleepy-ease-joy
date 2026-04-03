

## Analyse de la situation actuelle

Le système i18n est déjà en place avec :
- **3 langues** (en, fr, es) dans `translations.ts` (506 lignes de traductions)
- **Détection automatique du navigateur** dans `detectLanguage()` — un visiteur français voit le site en français par défaut
- **LanguageSwitcher** visible dans le Header (desktop + mobile) avec les drapeaux 🇺🇸🇫🇷🇪🇸
- **localStorage** pour mémoriser le choix

## Le problème

Actuellement, `detectLanguage()` détecte la langue du navigateur et l'applique automatiquement. Un visiteur espagnol verra le site en espagnol, un français en français. Or tu veux que **tout le monde arrive en anglais**, puis puisse changer manuellement.

## Plan — Forcer l'anglais par défaut

### Modification unique : `src/i18n/LanguageContext.tsx`

Modifier la fonction `detectLanguage()` pour ne vérifier que le localStorage (choix explicite de l'utilisateur), et retourner `"en"` par défaut si aucun choix n'a été fait :

```typescript
function detectLanguage(): Lang {
  const saved = localStorage.getItem("sleepzy-lang") as Lang;
  if (saved && ["en", "fr", "es"].includes(saved)) return saved;
  return "en"; // Toujours anglais par défaut
}
```

C'est tout. Le LanguageSwitcher reste en place dans le Header, les traductions fr/es restent disponibles. Dès qu'un utilisateur clique sur un drapeau, son choix est sauvegardé en localStorage et persistera lors de ses prochaines visites.

**Aucun autre fichier à modifier.**

