// Shopify webhook → Meta CAPI Purchase event.
//
// Receives `orders/create` from Shopify, validates HMAC signature, extracts
// the marketing attribution we stored as cart attributes (note_attributes on
// the order), and forwards a Purchase event to Meta CAPI for accurate
// attribution in Ads Manager.
//
// This webhook runs POST-PURCHASE. It cannot affect the sale: by the time
// Shopify calls us, the customer has already been charged. Any failure here
// just means the Purchase event won't appear in Meta — the order is safe.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const PIXEL_ID = '2093867758129616';
const GRAPH_VERSION = 'v21.0';

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyShopifyHmac(rawBody: string, hmacHeader: string | null, secret: string): Promise<boolean> {
  if (!hmacHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === hmacHeader;
}

function getNoteAttr(noteAttributes: Array<{ name: string; value: string }> | undefined, key: string): string | null {
  if (!noteAttributes) return null;
  const found = noteAttributes.find((n) => n.name === `_sleepzy_${key}`);
  return found?.value || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    const capiToken = Deno.env.get('META_CAPI_ACCESS_TOKEN');

    // Fail-closed: if the webhook secret is not configured, refuse to process
    // any payload. Without HMAC validation we cannot trust the request is
    // actually from Shopify, so we must never forward to Meta CAPI.
    if (!webhookSecret) {
      console.error('[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not configured — rejecting');
      return new Response(JSON.stringify({ skipped: 'no_secret' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const valid = await verifyShopifyHmac(rawBody, hmacHeader, webhookSecret);
    if (!valid) {
      console.warn('[shopify-webhook] invalid HMAC, ignoring');
      return new Response(JSON.stringify({ skipped: 'invalid_hmac' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!capiToken) {
      console.error('[shopify-webhook] META_CAPI_ACCESS_TOKEN missing');
      return new Response(JSON.stringify({ skipped: 'no_capi_token' }), { status: 200, headers: corsHeaders });
    }

    const order = JSON.parse(rawBody);
    const noteAttrs = order.note_attributes as Array<{ name: string; value: string }> | undefined;

    // Reconstruct attribution from order
    const fbclid = getNoteAttr(noteAttrs, 'fbclid');
    const fbp = getNoteAttr(noteAttrs, 'fbp');
    let fbc = getNoteAttr(noteAttrs, 'fbc');
    if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;

    const userAgent = getNoteAttr(noteAttrs, 'user_agent') || '';
    const clientIp = order.browser_ip || order.client_details?.browser_ip || null;

    const email: string | null = order.email || order.contact_email || null;
    const phone: string | null = order.phone || order.shipping_address?.phone || order.billing_address?.phone || null;

    const user_data: Record<string, unknown> = {};
    if (clientIp) user_data.client_ip_address = clientIp;
    if (userAgent) user_data.client_user_agent = userAgent;
    if (fbp) user_data.fbp = fbp;
    if (fbc) user_data.fbc = fbc;
    if (email) user_data.em = [await sha256(email)];
    if (phone) user_data.ph = [await sha256(phone.replace(/\D/g, ''))];
    if (order.shipping_address?.first_name) user_data.fn = [await sha256(order.shipping_address.first_name)];
    if (order.shipping_address?.last_name) user_data.ln = [await sha256(order.shipping_address.last_name)];
    if (order.shipping_address?.city) user_data.ct = [await sha256(order.shipping_address.city)];
    if (order.shipping_address?.country_code) user_data.country = [await sha256(order.shipping_address.country_code)];
    if (order.shipping_address?.zip) user_data.zp = [await sha256(order.shipping_address.zip)];

    const lineItems = (order.line_items || []) as Array<{ variant_id?: number; product_id?: number; quantity: number; title?: string; price?: string }>;
    const content_ids = lineItems.map((li) => String(li.variant_id || li.product_id)).filter(Boolean);
    const num_items = lineItems.reduce((s, li) => s + (li.quantity || 0), 0);
    const value = parseFloat(order.total_price || order.current_total_price || '0');
    const currency = order.currency || order.presentment_currency || 'CAD';

    // Stable event_id = order id, so a Pixel Purchase fired from Shopify's
    // native pixel (if enabled) gets deduped automatically.
    const event_id = `order_${order.id}`;

    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(new Date(order.created_at || Date.now()).getTime() / 1000),
          event_id,
          event_source_url: order.landing_site || order.referring_site || undefined,
          action_source: 'website',
          user_data,
          custom_data: {
            currency,
            value,
            content_ids,
            content_type: 'product',
            num_items,
            order_id: String(order.id),
          },
        },
      ],
    };

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(capiToken)}`;
    const metaRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const metaJson = await metaRes.json();

    if (!metaRes.ok) {
      console.error('[shopify-webhook] Meta CAPI error', metaRes.status, metaJson);
      // Still return 200 so Shopify doesn't retry endlessly
      return new Response(JSON.stringify({ skipped: 'meta_error', details: metaJson }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[shopify-webhook] Purchase sent', { event_id, value, currency, utm_source: getNoteAttr(noteAttrs, 'utm_source'), utm_campaign: getNoteAttr(noteAttrs, 'utm_campaign') });

    return new Response(JSON.stringify({ success: true, event_id, meta: metaJson }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[shopify-webhook] error', err);
    // Always 200 — failing this webhook can never roll back a real order
    return new Response(JSON.stringify({ skipped: 'exception', message: err instanceof Error ? err.message : 'unknown' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});