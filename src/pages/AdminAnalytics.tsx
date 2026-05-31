import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

/* ────────────────────────────────────────────────────────── */
/*  Types                                                     */
/* ────────────────────────────────────────────────────────── */

interface ShopifyOrder {
  id: number | string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string | null;
  cancelled_at?: string | null;
}

interface AttributedOrder {
  id: number | string;
  name?: string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string | null;
  cancelled_at?: string | null;
  email?: string | null;
  visitor_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  landing_site?: string | null;
  referring_site?: string | null;
}

interface ShopifyResult {
  summary: { currency: string };
  // we re-derive everything from the raw orders below
}

interface DayBucket {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  visitors: number;
  viewContent: number;
  addToCart: number;
  checkout: number;
  purchases: number;
}

interface KpiRow {
  label: string;
  unit: "currency" | "count" | "decimal" | "percent";
  d7: number;
  d14: number;
  d30: number;
  d90: number;
}

/* ────────────────────────────────────────────────────────── */
/*  Date helpers (local Canada / America-Toronto)             */
/* ────────────────────────────────────────────────────────── */

function toLocalDateKey(iso: string): string {
  // Canada/Eastern day bucket
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeDayKeys(days: number): string[] {
  // Yesterday and N-1 days back. Excludes today so the period is "complete".
  const keys: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = days; i >= 1; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    keys.push(toLocalDateKey(d.toISOString()));
  }
  return keys;
}

/* ────────────────────────────────────────────────────────── */
/*  Aggregation                                               */
/* ────────────────────────────────────────────────────────── */

function sumWindow(
  buckets: Map<string, DayBucket>,
  days: number,
  field: keyof Omit<DayBucket, "date">,
): number {
  const keys = makeDayKeys(days);
  let total = 0;
  for (const k of keys) {
    const b = buckets.get(k);
    if (b) total += b[field] as number;
  }
  return total;
}

function avgPerDay(
  buckets: Map<string, DayBucket>,
  days: number,
  field: keyof Omit<DayBucket, "date">,
): number {
  return sumWindow(buckets, days, field) / days;
}

function ratio(
  buckets: Map<string, DayBucket>,
  days: number,
  num: keyof Omit<DayBucket, "date">,
  den: keyof Omit<DayBucket, "date">,
): number {
  const d = sumWindow(buckets, days, den);
  if (d <= 0) return 0;
  return (sumWindow(buckets, days, num) / d) * 100;
}

function aov(
  buckets: Map<string, DayBucket>,
  days: number,
): number {
  const o = sumWindow(buckets, days, "orders");
  if (o <= 0) return 0;
  return sumWindow(buckets, days, "revenue") / o;
}

/* ────────────────────────────────────────────────────────── */
/*  Formatting                                                */
/* ────────────────────────────────────────────────────────── */

function fmt(n: number, unit: KpiRow["unit"], currency = "CAD"): string {
  if (!isFinite(n)) return "—";
  if (unit === "currency") {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  }
  if (unit === "count") return Math.round(n).toLocaleString("en-CA");
  if (unit === "decimal") return n.toFixed(1);
  if (unit === "percent") return `${n.toFixed(2)}%`;
  return String(n);
}

function VariationBadge({ d7, d30 }: { d7: number; d30: number }) {
  if (d30 === 0) return <span className="text-xs text-slate-400">—</span>;
  const diff = ((d7 - d30) / d30) * 100;
  const abs = Math.abs(diff);
  if (abs < 3) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Minus className="h-3 w-3" /> stable
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3 w-3" /> +{abs.toFixed(0)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
      <TrendingDown className="h-3 w-3" /> −{abs.toFixed(0)}%
    </span>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Data fetching                                             */
/* ────────────────────────────────────────────────────────── */

const WINDOW_DAYS = 90;

async function fetchAll(): Promise<{
  buckets: Map<string, DayBucket>;
  currency: string;
  errors: string[];
  attributedOrders: AttributedOrder[];
}> {
  const errors: string[] = [];
  let attributedOrders: AttributedOrder[] = [];
  const sinceIso = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Initialize 90 day buckets
  const buckets = new Map<string, DayBucket>();
  for (const k of makeDayKeys(WINDOW_DAYS)) {
    buckets.set(k, {
      date: k,
      revenue: 0,
      orders: 0,
      visitors: 0,
      viewContent: 0,
      addToCart: 0,
      checkout: 0,
      purchases: 0,
    });
  }

  const [shopRes, funnelRes, cartRes, checkoutRes] = await Promise.all([
    supabase.functions.invoke("shopify-analytics", {
      method: "GET",
      // path with query params via headers won't work; use functions/v1 with query
    }).catch((e: unknown) => ({ data: null, error: e })),
    supabase
      .from("funnel_events")
      .select("created_at, step, visitor_id")
      .gte("created_at", sinceIso)
      .limit(50000),
    supabase
      .from("cart_events")
      .select("created_at")
      .gte("created_at", sinceIso)
      .limit(50000),
    supabase
      .from("checkout_events")
      .select("created_at")
      .gte("created_at", sinceIso)
      .limit(50000),
  ]);

  // ── Shopify: re-fetch with proper days param via direct fetch ──
  let currency = "CAD";
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (token) {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-analytics?days=${WINDOW_DAYS}`;
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        currency = json?.summary?.currency || "CAD";
        const orders: ShopifyOrder[] = json?.attributedOrders || [];
        attributedOrders = (json?.attributedOrders || []) as AttributedOrder[];
        for (const o of orders) {
          if (!o.created_at) continue;
          const key = toLocalDateKey(o.created_at);
          const b = buckets.get(key);
          if (!b) continue;
          const paid = o.financial_status === "paid" || o.financial_status === "partially_paid";
          const cancelled = !!o.cancelled_at;
          if (paid && !cancelled) {
            b.revenue += parseFloat(o.total_price || "0");
            b.orders += 1;
            b.purchases += 1;
          }
        }
      } else {
        errors.push(`Shopify: HTTP ${resp.status}`);
      }
    }
  } catch (e) {
    errors.push(`Shopify: ${e instanceof Error ? e.message : "fetch failed"}`);
  }

  // ── Funnel events ──
  if (funnelRes.error) {
    errors.push(`Funnel: ${funnelRes.error.message}`);
  } else {
    // group visitors by day for uniqueness
    const visitorsByDay = new Map<string, Set<string>>();
    for (const row of funnelRes.data || []) {
      const key = toLocalDateKey(row.created_at as string);
      const b = buckets.get(key);
      if (!b) continue;
      const step = row.step as string;
      const vid = (row.visitor_id as string) || "anon";
      if (step === "page_view" || step === "PageView" || step === "view_home") {
        if (!visitorsByDay.has(key)) visitorsByDay.set(key, new Set());
        visitorsByDay.get(key)!.add(vid);
      }
      if (step === "view_content" || step === "ViewContent") {
        b.viewContent += 1;
      }
    }
    for (const [key, set] of visitorsByDay.entries()) {
      const b = buckets.get(key);
      if (b) b.visitors = set.size;
    }
  }

  // ── Cart events ──
  if (cartRes.error) {
    errors.push(`Cart: ${cartRes.error.message}`);
  } else {
    for (const row of cartRes.data || []) {
      const key = toLocalDateKey(row.created_at as string);
      const b = buckets.get(key);
      if (b) b.addToCart += 1;
    }
  }

  // ── Checkout events ──
  if (checkoutRes.error) {
    errors.push(`Checkout: ${checkoutRes.error.message}`);
  } else {
    for (const row of checkoutRes.data || []) {
      const key = toLocalDateKey(row.created_at as string);
      const b = buckets.get(key);
      if (b) b.checkout += 1;
    }
  }

  // discard the placeholder Shopify response we threw away
  void shopRes;

  return { buckets, currency, errors, attributedOrders };
}

/* ────────────────────────────────────────────────────────── */
/*  Page                                                      */
/* ────────────────────────────────────────────────────────── */

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buckets, setBuckets] = useState<Map<string, DayBucket>>(new Map());
  const [currency, setCurrency] = useState("CAD");
  const [errors, setErrors] = useState<string[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [attributedOrders, setAttributedOrders] = useState<AttributedOrder[]>([]);
  const [attribWindow, setAttribWindow] = useState<7 | 30 | 90>(30);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetchAll();
      setBuckets(res.buckets);
      setCurrency(res.currency);
      setErrors(res.errors);
      setAttributedOrders(res.attributedOrders);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── KPI rows ── */
  const rows: KpiRow[] = useMemo(() => {
    const make = (
      label: string,
      unit: KpiRow["unit"],
      fn: (days: number) => number,
    ): KpiRow => ({
      label,
      unit,
      d7: fn(7),
      d14: fn(14),
      d30: fn(30),
      d90: fn(90),
    });

    return [
      make("Revenu / jour", "currency", (d) => avgPerDay(buckets, d, "revenue")),
      make("Commandes / jour", "decimal", (d) => avgPerDay(buckets, d, "orders")),
      make("AOV (panier moyen)", "currency", (d) => aov(buckets, d)),
      make("Visiteurs / jour", "count", (d) => avgPerDay(buckets, d, "visitors")),
      make("Add to cart / jour", "decimal", (d) => avgPerDay(buckets, d, "addToCart")),
      make("Checkout / jour", "decimal", (d) => avgPerDay(buckets, d, "checkout")),
      make("Conversion globale", "percent", (d) => ratio(buckets, d, "purchases", "visitors")),
    ];
  }, [buckets]);

  /* ── Funnel 7d ── */
  const funnel7 = useMemo(() => {
    const visitors = sumWindow(buckets, 7, "visitors");
    const viewContent = sumWindow(buckets, 7, "viewContent");
    const addToCart = sumWindow(buckets, 7, "addToCart");
    const checkout = sumWindow(buckets, 7, "checkout");
    const purchases = sumWindow(buckets, 7, "purchases");
    return { visitors, viewContent, addToCart, checkout, purchases };
  }, [buckets]);

  const funnel30Avg = useMemo(() => {
    const visitors = avgPerDay(buckets, 30, "visitors") * 7;
    return {
      visitors,
      viewContent: avgPerDay(buckets, 30, "viewContent") * 7,
      addToCart: avgPerDay(buckets, 30, "addToCart") * 7,
      checkout: avgPerDay(buckets, 30, "checkout") * 7,
      purchases: avgPerDay(buckets, 30, "purchases") * 7,
    };
  }, [buckets]);

  /* ── 90-day chart series ── */
  const chartData = useMemo(() => {
    return makeDayKeys(WINDOW_DAYS).map((k) => {
      const b = buckets.get(k);
      if (!b) {
        return { date: k.slice(5), revenu: 0, conversion: 0 };
      }
      const conv = b.visitors > 0 ? (b.purchases / b.visitors) * 100 : 0;
      return {
        date: k.slice(5), // MM-DD
        revenu: Math.round(b.revenue),
        conversion: parseFloat(conv.toFixed(2)),
      };
    });
  }, [buckets]);

  /* ── Hero KPIs ── */
  const hero = useMemo(() => {
    const rev7 = sumWindow(buckets, 7, "revenue");
    const orders7 = sumWindow(buckets, 7, "orders");
    const aov7 = orders7 > 0 ? rev7 / orders7 : 0;
    const conv7 = ratio(buckets, 7, "purchases", "visitors");
    const visitors7 = sumWindow(buckets, 7, "visitors");
    const purchases7 = sumWindow(buckets, 7, "purchases");

    const revPerDay30 = avgPerDay(buckets, 30, "revenue");
    const conv30 = ratio(buckets, 30, "purchases", "visitors");
    return {
      rev7,
      orders7,
      aov7,
      conv7,
      visitors7,
      purchases7,
      revPerDay30,
      conv30,
    };
  }, [buckets]);

  /* ── Daily breakdown last 7 days (Mon→Sun order based on actual dates) ── */
  const last7Days = useMemo(() => {
    const keys = makeDayKeys(7); // J-7 → J-1, chronological
    const weekdayFmt = new Intl.DateTimeFormat("fr-CA", { weekday: "short" });
    const dateFmt = new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "2-digit" });
    return keys.map((k) => {
      const b = buckets.get(k);
      const [y, m, d] = k.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      const conv = b && b.visitors > 0 ? (b.purchases / b.visitors) * 100 : 0;
      const aovDay = b && b.orders > 0 ? b.revenue / b.orders : 0;
      return {
        key: k,
        weekday: weekdayFmt.format(dateObj).replace(".", ""),
        date: dateFmt.format(dateObj),
        revenue: b?.revenue ?? 0,
        orders: b?.orders ?? 0,
        visitors: b?.visitors ?? 0,
        addToCart: b?.addToCart ?? 0,
        checkout: b?.checkout ?? 0,
        purchases: b?.purchases ?? 0,
        aov: aovDay,
        conv,
      };
    });
  }, [buckets]);

  /* ── Meta attribution aggregations ── */
  const paidAttributedInWindow = useMemo(() => {
    const cutoff = Date.now() - attribWindow * 24 * 60 * 60 * 1000;
    return attributedOrders.filter((o) => {
      const paid = o.financial_status === "paid" || o.financial_status === "partially_paid";
      if (!paid || o.cancelled_at) return false;
      const t = new Date(o.created_at).getTime();
      return t >= cutoff;
    });
  }, [attributedOrders, attribWindow]);

  const adsBreakdown = useMemo(() => {
    type Row = {
      key: string;
      source: string;
      campaign: string;
      ad: string;
      orders: number;
      revenue: number;
    };
    const map = new Map<string, Row>();
    for (const o of paidAttributedInWindow) {
      const source = o.utm_source || (o.fbclid ? "facebook" : "(direct)");
      const campaign = o.utm_campaign || "(sans campagne)";
      const ad = o.utm_content || "(sans ad)";
      const key = `${source}||${campaign}||${ad}`;
      const row = map.get(key) || { key, source, campaign, ad, orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += parseFloat(o.total_price || "0");
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [paidAttributedInWindow]);

  const adsTotals = useMemo(() => {
    const totalOrders = paidAttributedInWindow.length;
    const totalRevenue = paidAttributedInWindow.reduce(
      (s, o) => s + parseFloat(o.total_price || "0"),
      0,
    );
    const metaOrders = paidAttributedInWindow.filter(
      (o) => (o.utm_source || "").toLowerCase() === "facebook" || !!o.fbclid,
    ).length;
    const metaRevenue = paidAttributedInWindow
      .filter((o) => (o.utm_source || "").toLowerCase() === "facebook" || !!o.fbclid)
      .reduce((s, o) => s + parseFloat(o.total_price || "0"), 0);
    return { totalOrders, totalRevenue, metaOrders, metaRevenue };
  }, [paidAttributedInWindow]);

  const recentAttributedOrders = useMemo(() => {
    return [...attributedOrders]
      .filter((o) => {
        const paid = o.financial_status === "paid" || o.financial_status === "partially_paid";
        return paid && !o.cancelled_at;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  }, [attributedOrders]);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Chargement des données 90 jours…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sleep&zy — Performance produit</h1>
            <p className="text-xs text-slate-500 mt-1">
              {lastRefresh
                ? `Dernière mise à jour : ${lastRefresh.toLocaleTimeString("fr-CA")}`
                : "—"}
              {" · "}Fenêtres : 7 jours (J-7 → J-1) et moyennes 14/30/90j
            </p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 space-y-8">
        {errors.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Données partielles :</strong>{" "}
            {errors.join(" · ")}
          </div>
        )}

        {/* Hero KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Revenu — 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {fmt(hero.rev7, "currency", currency)}
              </div>
              <div className="mt-2 flex items-baseline gap-4 text-sm text-slate-600">
                <span>
                  <strong>{hero.orders7}</strong> commandes payées
                </span>
                <span>
                  AOV <strong>{fmt(hero.aov7, "currency", currency)}</strong>
                </span>
              </div>
              <div className="mt-3">
                <VariationBadge
                  d7={hero.rev7 / 7}
                  d30={hero.revPerDay30}
                />
                <span className="ml-2 text-xs text-slate-500">vs moyenne 30j</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Conversion — 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {fmt(hero.conv7, "percent")}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                <strong>{hero.purchases7}</strong> achats /{" "}
                <strong>{hero.visitors7.toLocaleString("en-CA")}</strong> visiteurs
              </div>
              <div className="mt-3">
                <VariationBadge d7={hero.conv7} d30={hero.conv30} />
                <span className="ml-2 text-xs text-slate-500">vs moyenne 30j</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Daily breakdown last 7 days */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Historique jour par jour — 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jour</TableHead>
                  <TableHead className="text-right">Revenu</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Visiteurs</TableHead>
                  <TableHead className="text-right">Add to cart</TableHead>
                  <TableHead className="text-right">Checkout</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {last7Days.map((d) => (
                  <TableRow key={d.key}>
                    <TableCell className="font-medium capitalize">
                      {d.weekday}{" "}
                      <span className="text-xs text-slate-500">{d.date}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(d.revenue, "currency", currency)}
                    </TableCell>
                    <TableCell className="text-right">{d.orders}</TableCell>
                    <TableCell className="text-right text-slate-600">
                      {d.orders > 0 ? fmt(d.aov, "currency", currency) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.visitors.toLocaleString("en-CA")}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {d.addToCart}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {d.checkout}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {d.visitors > 0 ? fmt(d.conv, "percent") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-slate-500">
              Du plus ancien (J-7) au plus récent (J-1, hier). Aujourd'hui est
              exclu pour ne comparer que des journées complètes.
            </p>
          </CardContent>
        </Card>

        {/* Meta attribution — quelles pubs génèrent les ventes */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  Attribution Meta — quelles publicités ont généré les ventes
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Source&nbsp;: <code>note_attributes</code> écrits sur la commande Shopify
                  au moment du checkout (<code>utm_source</code>, <code>utm_campaign</code>,{" "}
                  <code>utm_content</code>, <code>fbclid</code>).
                </p>
              </div>
              <div className="inline-flex rounded-md border bg-white p-0.5 text-xs">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAttribWindow(d as 7 | 30 | 90)}
                    className={`px-3 py-1.5 rounded ${
                      attribWindow === d
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Ventes attribuées (total)
                </div>
                <div className="text-xl font-semibold">{adsTotals.totalOrders}</div>
                <div className="text-xs text-slate-600">
                  {fmt(adsTotals.totalRevenue, "currency", currency)}
                </div>
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Dont via Meta (Facebook/Instagram)
                </div>
                <div className="text-xl font-semibold">{adsTotals.metaOrders}</div>
                <div className="text-xs text-slate-600">
                  {fmt(adsTotals.metaRevenue, "currency", currency)}
                </div>
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Part Meta du CA
                </div>
                <div className="text-xl font-semibold">
                  {adsTotals.totalRevenue > 0
                    ? `${((adsTotals.metaRevenue / adsTotals.totalRevenue) * 100).toFixed(0)}%`
                    : "—"}
                </div>
              </div>
              <div className="rounded-md border bg-slate-50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  AOV Meta
                </div>
                <div className="text-xl font-semibold">
                  {adsTotals.metaOrders > 0
                    ? fmt(adsTotals.metaRevenue / adsTotals.metaOrders, "currency", currency)
                    : "—"}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">
                Classement par publicité (campagne · ad)
              </h3>
              {adsBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucune commande attribuée sur cette fenêtre.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Campagne</TableHead>
                      <TableHead>Publicité (ad)</TableHead>
                      <TableHead className="text-right">Ventes</TableHead>
                      <TableHead className="text-right">Revenu</TableHead>
                      <TableHead className="text-right">AOV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adsBreakdown.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium capitalize">{r.source}</TableCell>
                        <TableCell className="text-slate-700 max-w-[260px] truncate" title={r.campaign}>
                          {r.campaign}
                        </TableCell>
                        <TableCell className="text-slate-700 max-w-[260px] truncate" title={r.ad}>
                          {r.ad}
                        </TableCell>
                        <TableCell className="text-right">{r.orders}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {fmt(r.revenue, "currency", currency)}
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {fmt(r.revenue / r.orders, "currency", currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">
                20 dernières ventes — publicité d'origine
              </h3>
              {recentAttributedOrders.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune commande payée récente.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Commande</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Campagne</TableHead>
                      <TableHead>Publicité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttributedOrders.map((o) => {
                      const source = o.utm_source || (o.fbclid ? "facebook" : "(direct)");
                      return (
                        <TableRow key={String(o.id)}>
                          <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                            {new Date(o.created_at).toLocaleString("fr-CA", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="font-medium">{o.name || `#${o.id}`}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {fmt(parseFloat(o.total_price || "0"), "currency", currency)}
                          </TableCell>
                          <TableCell className="capitalize">{source}</TableCell>
                          <TableCell className="max-w-[220px] truncate" title={o.utm_campaign || ""}>
                            {o.utm_campaign || <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate" title={o.utm_content || ""}>
                            {o.utm_content || <span className="text-slate-400">—</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Astuce&nbsp;: dans Meta Ads Manager, configure les URL parameters de tes pubs avec{" "}
              <code>utm_source=facebook&amp;utm_medium=paid&amp;utm_campaign={`{{campaign.name}}`}&amp;utm_content={`{{ad.name}}`}</code>{" "}
              pour que le nom exact de chaque pub remonte ici.
            </p>
          </CardContent>
        </Card>

        {/* Comparison table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tableau comparatif — moyennes journalières</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead className="text-right">7 derniers jours</TableHead>
                  <TableHead className="text-right">Moy. 14j</TableHead>
                  <TableHead className="text-right">Moy. 30j</TableHead>
                  <TableHead className="text-right">Moy. 90j</TableHead>
                  <TableHead className="text-right">7j vs 30j</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.label}>
                    <TableCell className="font-medium">{r.label}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(r.d7, r.unit, currency)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {fmt(r.d14, r.unit, currency)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {fmt(r.d30, r.unit, currency)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {fmt(r.d90, r.unit, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <VariationBadge d7={r.d7} d30={r.d30} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-slate-500">
              Les moyennes 14/30/90j sont exprimées <strong>par jour</strong> pour
              être directement comparables à la colonne "7 derniers jours" (elle aussi
              normalisée par jour quand pertinent — revenu, commandes, visiteurs).
              <br />
              Pour AOV et conversion %, ce sont des ratios calculés sur la fenêtre.
            </p>
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel d'achat — 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FunnelStep
              label="Visiteurs uniques"
              current={funnel7.visitors}
              avg30={funnel30Avg.visitors}
              max={funnel7.visitors}
              prev={null}
            />
            <FunnelStep
              label="Vue produit"
              current={funnel7.viewContent}
              avg30={funnel30Avg.viewContent}
              max={funnel7.visitors}
              prev={funnel7.visitors}
            />
            <FunnelStep
              label="Add to cart"
              current={funnel7.addToCart}
              avg30={funnel30Avg.addToCart}
              max={funnel7.visitors}
              prev={funnel7.viewContent || funnel7.visitors}
            />
            <FunnelStep
              label="Checkout initié"
              current={funnel7.checkout}
              avg30={funnel30Avg.checkout}
              max={funnel7.visitors}
              prev={funnel7.addToCart}
            />
            <FunnelStep
              label="Achat payé"
              current={funnel7.purchases}
              avg30={funnel30Avg.purchases}
              max={funnel7.visitors}
              prev={funnel7.checkout}
            />
          </CardContent>
        </Card>

        {/* 90 day trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendance 90 jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="revenu" name={`Revenu (${currency})`} fill="#0f172a" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    name="Conversion %"
                    stroke="#d4af37"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <footer className="pt-4 text-center text-xs text-slate-400">
          Sources&nbsp;: Shopify Admin API · Supabase (funnel_events, cart_events, checkout_events).
          {" "}
          <a
            href="https://clarity.microsoft.com/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-slate-600"
          >
            Voir Clarity <ExternalLink className="h-3 w-3" />
          </a>
        </footer>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Funnel step                                               */
/* ────────────────────────────────────────────────────────── */

function FunnelStep({
  label,
  current,
  avg30,
  max,
  prev,
}: {
  label: string;
  current: number;
  avg30: number;
  max: number;
  prev: number | null;
}) {
  const pctOfTop = max > 0 ? (current / max) * 100 : 0;
  const pctAvg = max > 0 ? (avg30 / max) * 100 : 0;
  const dropoff = prev !== null && prev > 0
    ? ((current / prev) * 100)
    : null;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-slate-600">
          <strong>{Math.round(current).toLocaleString("en-CA")}</strong>
          {dropoff !== null && (
            <span className="ml-2 text-xs text-slate-500">
              ({dropoff.toFixed(1)}% de l'étape précédente)
            </span>
          )}
        </span>
      </div>
      <div className="relative h-6 bg-slate-100 rounded overflow-hidden">
        {/* 30d average ghost bar */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-200"
          style={{ width: `${Math.min(pctAvg, 100)}%` }}
          title={`Moy. 30j (extrapolée 7j) : ${avg30.toFixed(0)}`}
        />
        {/* current 7d bar */}
        <div
          className="absolute top-0 left-0 h-full bg-slate-900"
          style={{ width: `${Math.min(pctOfTop, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs text-white font-medium mix-blend-difference">
          {pctOfTop.toFixed(1)}%
        </div>
      </div>
      <div className="mt-0.5 text-[10px] text-slate-400">
        Barre claire = moyenne 30j projetée sur 7j ({avg30.toFixed(0)})
      </div>
    </div>
  );
}