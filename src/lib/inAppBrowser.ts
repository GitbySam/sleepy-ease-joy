/**
 * In-app browser detection (Instagram, Facebook, TikTok, Snapchat, Messenger,
 * LinkedIn, Line). These browsers block popups, mishandle Shopify checkout,
 * and have cookie restrictions — they are the #1 cause of checkout drop-off.
 */
export type InAppBrowser =
  | 'instagram'
  | 'facebook'
  | 'messenger'
  | 'tiktok'
  | 'snapchat'
  | 'linkedin'
  | 'line'
  | 'pinterest'
  | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'facebook';
  if (/Messenger/i.test(ua)) return 'messenger';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'tiktok';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  if (/LinkedInApp/i.test(ua)) return 'linkedin';
  if (/Line\//i.test(ua)) return 'line';
  if (/Pinterest/i.test(ua)) return 'pinterest';
  return null;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Try to open the given URL in the OS default browser, escaping the in-app
 * webview. On Android we use Chrome intent. On iOS there is no reliable way
 * to force Safari programmatically — we copy the URL to the clipboard and
 * the UI shows instructions.
 */
export async function openExternally(url: string): Promise<'opened' | 'copied' | 'failed'> {
  try {
    if (isAndroid()) {
      // Chrome intent — works from FB/IG webview on most Android devices.
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      return 'opened';
    }
    // iOS: copy to clipboard so the user can paste in Safari.
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    /* ignore */
  }
  return 'failed';
}