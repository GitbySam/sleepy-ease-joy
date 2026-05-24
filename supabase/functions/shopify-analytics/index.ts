const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'sleepenzy.myshopify.com';
const SHOPIFY_API_VERSION = '2025-07';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// In-memory token cache (per cold-start). OAuth client_credentials tokens
// from the Shopify Dev Dashboard expire after ~24h.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getShopifyAccessToken(): Promise<{ token?: string; error?: Response }> {
  // Re-use cached token if it's still valid for at least 5 minutes
  if (cachedToken && cachedToken.expiresAt - Date.now() > 5 * 60 * 1000) {
    return { token: cachedToken.value };
  }

  // Allow legacy permanent token if present (backwards compat)
  const legacyToken =
    Deno.env.get('SHOPIFY_ADMIN_API_TOKEN') ?? Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  const clientId = Deno.env.get('SHOPIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SHOPIFY_CLIENT_SECRET');

  if (clientId && clientSecret) {
    const tokenRes = await fetch(`https://${SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Shopify OAuth token exchange failed:', tokenRes.status, errText);
      return {
        error: jsonResponse({
          code: 'shopify_oauth_failed',
          error: `Échec de l'échange OAuth Shopify [${tokenRes.status}].`,
          details: errText.slice(0, 500),
          action:
            "Vérifie SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET du Dev Dashboard et que l'app est installée sur la boutique.",
        }, 502),
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken: string | undefined = tokenData.access_token;
    const expiresIn: number = tokenData.expires_in ?? 86400; // default 24h
    if (!accessToken) {
      return {
        error: jsonResponse({
          code: 'shopify_oauth_no_token',
          error: "Shopify n'a pas renvoyé d'access_token.",
          details: JSON.stringify(tokenData).slice(0, 500),
        }, 502),
      };
    }

    cachedToken = {
      value: accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return { token: accessToken };
  }

  if (legacyToken) {
    return { token: legacyToken };
  }

  return {
    error: jsonResponse({
      code: 'shopify_credentials_missing',
      error: 'Identifiants Shopify manquants.',
      action:
        'Configure SHOPIFY_CLIENT_ID et SHOPIFY_CLIENT_SECRET (depuis le Dev Dashboard Shopify).',
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const tokenResult = await getShopifyAccessToken();
  if (tokenResult.error) return tokenResult.error;
  const SHOPIFY_ACCESS_TOKEN = tokenResult.token!;

  try {
    const url = new URL(req.url);
    const daysBack = parseInt(url.searchParams.get('days') || '30');
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);
    const sinceISO = sinceDate.toISOString();

    // Fetch orders
    const ordersRes = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&created_at_min=${sinceISO}&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!ordersRes.ok) {
      const errorText = await ordersRes.text();
      if (ordersRes.status === 401 || ordersRes.status === 403) {
        console.error('Shopify Admin API authentication failed:', errorText);
        // Invalidate cache so the next call tries to refresh
        cachedToken = null;
        return jsonResponse({
          code: 'shopify_admin_auth_failed',
          error: 'Token Shopify invalide ou scopes insuffisants.',
          action: "Vérifie que l'app Dev Dashboard est installée sur la boutique et a les scopes read_orders, read_customers, read_checkouts.",
          details: errorText.slice(0, 500),
        });
      }

      return jsonResponse({
        code: 'shopify_orders_api_failed',
        error: `Shopify orders API failed [${ordersRes.status}]`,
        details: errorText.slice(0, 500),
      }, 502);
    }

    const ordersData = await ordersRes.json();
    const orders = ordersData.orders || [];

    // Fetch customers count
    const customersRes = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/count.json?created_at_min=${sinceISO}`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    let newCustomers = 0;
    if (customersRes.ok) {
      const customersData = await customersRes.json();
      newCustomers = customersData.count || 0;
    }

    // Fetch abandoned checkouts (Admin API)
    // These are checkouts where the user reached the Shopify checkout page,
    // entered some info (often email) but did NOT complete payment.
    const abandonedRes = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/checkouts.json?created_at_min=${sinceISO}&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        },
      }
    );

    let abandonedCheckouts: any[] = [];
    let abandonedScopeMissing = false;
    if (abandonedRes.ok) {
      const abandonedData = await abandonedRes.json();
      abandonedCheckouts = abandonedData.checkouts || [];
    } else if (abandonedRes.status === 401 || abandonedRes.status === 403) {
      abandonedScopeMissing = true;
      console.warn('Abandoned checkouts scope missing (read_checkouts).');
    }

    const abandonedCount = abandonedCheckouts.length;
    const abandonedValue = abandonedCheckouts.reduce(
      (sum: number, c: any) => sum + parseFloat(c.total_price || '0'),
      0,
    );
    const abandonedWithEmail = abandonedCheckouts.filter((c: any) => !!c.email).length;

    // Process orders
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: any) => o.financial_status === 'paid' || o.financial_status === 'partially_paid');
    const refundedOrders = orders.filter((o: any) => o.financial_status === 'refunded');
    const cancelledOrders = orders.filter((o: any) => o.cancelled_at !== null);

    // Real revenue = paid orders only (not pending/refunded/cancelled)
    const realRevenue = paidOrders.reduce(
      (sum: number, o: any) => sum + parseFloat(o.total_price || '0'),
      0,
    );
    const realAOV = paidOrders.length > 0 ? realRevenue / paidOrders.length : 0;

    // Average order value
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by day
    const ordersByDay: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      const day = new Date(o.created_at).toISOString().split('T')[0];
      if (!ordersByDay[day]) ordersByDay[day] = { orders: 0, revenue: 0 };
      ordersByDay[day].orders++;
      ordersByDay[day].revenue += parseFloat(o.total_price || '0');
    });

    // Top products
    const productSales: Record<string, { title: string; quantity: number; revenue: number }> = {};
    orders.forEach((o: any) => {
      (o.line_items || []).forEach((item: any) => {
        const key = item.product_id || item.title;
        if (!productSales[key]) {
          productSales[key] = { title: item.title, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += parseFloat(item.price || '0') * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Orders by country
    const byCountry: Record<string, number> = {};
    orders.forEach((o: any) => {
      const country = o.billing_address?.country_code || o.shipping_address?.country_code || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });

    const topCountries = Object.entries(byCountry)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Currency
    const currency = orders[0]?.currency || 'USD';

    const result = {
      period: { days: daysBack, since: sinceISO },
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(aov * 100) / 100,
        paidOrders: paidOrders.length,
        refundedOrders: refundedOrders.length,
        cancelledOrders: cancelledOrders.length,
        newCustomers,
        currency,
        // Real (paid only) figures — what the user actually banked
        realRevenue: Math.round(realRevenue * 100) / 100,
        realAOV: Math.round(realAOV * 100) / 100,
        // Abandoned checkout metrics
        abandonedCount,
        abandonedValue: Math.round(abandonedValue * 100) / 100,
        abandonedWithEmail,
        abandonedScopeMissing,
      },
      ordersByDay,
      topProducts,
      topCountries,
      abandonedCheckouts: abandonedCheckouts.slice(0, 25).map((c: any) => ({
        id: c.id,
        email: c.email,
        total_price: c.total_price,
        currency: c.currency,
        created_at: c.created_at,
        abandoned_checkout_url: c.abandoned_checkout_url,
        line_items_count: (c.line_items || []).length,
      })),
    };

    return jsonResponse(result);
  } catch (error: unknown) {
    console.error('Error fetching Shopify analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({
      code: 'shopify_analytics_unexpected_error',
      error: 'Erreur inattendue pendant le chargement des analytics Shopify.',
      details: errorMessage,
    }, 502);
  }
});
