

## Problem

The TrustBar component uses translation keys like `trustBar.freeShipping`, `trustBar.securePayment`, `trustBar.guarantee`, `trustBar.ssl` — but these keys don't exist in the translations file. The `t()` function falls back to showing the raw key name.

## Plan

**Option A (simplest):** Remove i18n from TrustBar since the site is now English-only. Hardcode the labels directly.

### Changes

**File: `src/components/TrustBar.tsx`**
- Remove `useLanguage` import and usage
- Hardcode badge labels:
  - `Free Shipping`
  - `Secure Payment`
  - `90-Day Guarantee`
  - `SSL Encrypted`

