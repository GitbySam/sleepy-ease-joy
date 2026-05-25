/**
 * Meta CAPI client wrapper.
 *
 * Mirrors each Pixel event server-side via a Supabase Edge Function so
 * ad-blockers can't suppress conversions. Sends the same event_id as the
 * browser Pixel so Meta deduplicates automatically.
 *
 * Failures are silent — tracking must never block the UX.
 */

import { supabase } from '@/integrations/supabase/client';
import { getAttribution } from './attribution';

type CapiEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

interface CapiPayload {
  event_name: CapiEventName;
  event_id: string;
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  num_items?: number;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/** Generate a unique event_id used to dedupe Pixel + CAPI on Meta's side */
export function makeEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fire-and-forget Meta CAPI event. Never throws. */
export function sendCapiEvent(payload: CapiPayload): void {
  try {
    const attribution = getAttribution();
    const event = {
      ...payload,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
      fbclid: attribution?.fbclid ?? null,
    };

    // Fire-and-forget; don't await
    supabase.functions.invoke('meta-capi', { body: { event } }).catch((err) => {
      console.debug('[CAPI] send failed silently', err);
    });
  } catch (err) {
    console.debug('[CAPI] error', err);
  }
}