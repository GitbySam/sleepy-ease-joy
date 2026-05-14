const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'kdpwn5-0h.myshopify.com';
const SHOPIFY_API_VERSION = '2025-07';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  if (!SHOPIFY_ACCESS_TOKEN) {
    return jsonResponse({
      code: 'shopify_token_missing',
      error: 'SHOPIFY_ACCESS_TOKEN is not configured.',
      action: 'Add a permanent Shopify Admin API token that starts with shpat_.',
    }, 503);
  }
    });
  }

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
        return jsonResponse({
          code: 'shopify_admin_auth_failed',
          error: 'Token Shopify Admin invalide ou expiré. Mets à jour SHOPIFY_ACCESS_TOKEN avec un token Admin API permanent commençant par shpat_.',
          action: 'Scopes requis : read_orders, read_customers, read_checkouts.',
        }, 401);
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
