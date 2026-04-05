const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SHOPIFY_STORE_DOMAIN = 'kdpwn5-0h.myshopify.com';
const SHOPIFY_API_VERSION = '2025-07';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SHOPIFY_ACCESS_TOKEN = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  if (!SHOPIFY_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'SHOPIFY_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      throw new Error(`Shopify orders API failed [${ordersRes.status}]: ${errorText}`);
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

    // Process orders
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: any) => o.financial_status === 'paid' || o.financial_status === 'partially_paid');
    const refundedOrders = orders.filter((o: any) => o.financial_status === 'refunded');
    const cancelledOrders = orders.filter((o: any) => o.cancelled_at !== null);

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
      },
      ordersByDay,
      topProducts,
      topCountries,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching Shopify analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
