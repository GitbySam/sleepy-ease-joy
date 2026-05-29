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
}> {
  const errors: string[] = [];
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

  return { buckets, currency, errors };
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

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetchAll();
      setBuckets(res.buckets);
      setCurrency(res.currency);
      setErrors(res.errors);
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
      const b = buckets.get(k)!;
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