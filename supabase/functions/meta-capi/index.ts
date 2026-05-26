import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PIXEL_ID = '2093867758129616';
const GRAPH_VERSION = 'v21.0';

const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
]);
const MAX_EVENT_VALUE = 500; // CAD; realistic cap for our highest bundle
const MAX_NUM_ITEMS = 20;

type CapiEvent = {
  event_name: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  fbp?: string | null;
  fbc?: string | null;
  fbclid?: string | null;
  email?: string | null;
  phone?: string | null;
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  num_items?: number;
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getClientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = Deno.env.get('META_CAPI_ACCESS_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ error: 'META_CAPI_ACCESS_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as { event: CapiEvent };
    const ev = body?.event;
    if (!ev?.event_name) {
      return new Response(JSON.stringify({ error: 'event_name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Allowlist event types — reject anything outside our funnel.
    if (!ALLOWED_EVENTS.has(ev.event_name)) {
      return new Response(JSON.stringify({ error: 'event_name not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cap value to prevent ad-metric poisoning via inflated Purchase events.
    if (ev.value !== undefined) {
      if (typeof ev.value !== 'number' || !Number.isFinite(ev.value) || ev.value < 0) {
        return new Response(JSON.stringify({ error: 'invalid value' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (ev.value > MAX_EVENT_VALUE) {
        console.warn('[meta-capi] value exceeds cap, clamping', ev.value);
        ev.value = MAX_EVENT_VALUE;
      }
    }
    if (ev.num_items !== undefined) {
      if (typeof ev.num_items !== 'number' || ev.num_items < 0 || ev.num_items > MAX_NUM_ITEMS) {
        ev.num_items = Math.min(Math.max(0, Number(ev.num_items) || 0), MAX_NUM_ITEMS);
      }
    }

    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || '';

    // Build fbc from fbclid if needed
    let fbc = ev.fbc || null;
    if (!fbc && ev.fbclid) {
      fbc = `fb.1.${Date.now()}.${ev.fbclid}`;
    }

    const user_data: Record<string, unknown> = {
      client_ip_address: ip,
      client_user_agent: ua,
    };
    if (ev.fbp) user_data.fbp = ev.fbp;
    if (fbc) user_data.fbc = fbc;
    if (ev.email) user_data.em = [await sha256(ev.email)];
    if (ev.phone) user_data.ph = [await sha256(ev.phone.replace(/\D/g, ''))];

    const custom_data: Record<string, unknown> = {};
    if (ev.value !== undefined) custom_data.value = ev.value;
    if (ev.currency) custom_data.currency = ev.currency;
    if (ev.content_ids?.length) custom_data.content_ids = ev.content_ids;
    if (ev.content_name) custom_data.content_name = ev.content_name;
    if (ev.content_type) custom_data.content_type = ev.content_type;
    if (ev.num_items !== undefined) custom_data.num_items = ev.num_items;

    const payload = {
      data: [
        {
          event_name: ev.event_name,
          event_time: ev.event_time || Math.floor(Date.now() / 1000),
          event_id: ev.event_id, // for Pixel/CAPI dedup
          event_source_url: ev.event_source_url,
          action_source: 'website',
          user_data,
          custom_data,
        },
      ],
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaJson = await metaRes.json();

    if (!metaRes.ok) {
      console.error('Meta CAPI error', metaRes.status, metaJson);
      return new Response(JSON.stringify({ error: 'meta_error', status: metaRes.status, details: metaJson }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, meta: metaJson }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('meta-capi error', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});