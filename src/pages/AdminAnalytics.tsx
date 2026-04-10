import { useState, useEffect } from "react";
import { Users, Eye, ShoppingCart, CreditCard, TrendingDown, FileText, DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */
interface ShopifyAnalytics {
  period: { days: number; since: string };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    paidOrders: number;
    refundedOrders: number;
    cancelledOrders: number;
    newCustomers: number;
    currency: string;
  };
  ordersByDay: Record<string, { orders: number; revenue: number }>;
  topProducts: Array<{ title: string; quantity: number; revenue: number }>;
  topCountries: Array<{ code: string; count: number }>;
}

/* ── Meta Pixel events (manual until Meta API connected) ── */
const pixelEvents = [
  { event: "PageView", count: 502 },
  { event: "ViewContent", count: 123 },
  { event: "AddToCart", count: 12 },
  { event: "InitiateCheckout", count: 13 },
  { event: "ScrollDepth_50", count: 87 },
  { event: "ScrollDepth_75", count: 42 },
  { event: "TimeOnSite_30s", count: 95 },
];

/* ── Tabs ── */
const TABS = [
  { id: "sales", label: "💰 Ventes (Live)" },
  { id: "traffic", label: "📈 Trafic" },
  { id: "sources", label: "🔗 Sources" },
  { id: "meta", label: "📱 Meta Ads" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PERIOD_OPTIONS = [
  { label: "7j", value: 7 },
  { label: "14j", value: 14 },
  { label: "30j", value: 30 },
  { label: "90j", value: 90 },
];

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<TabId>("sales");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ShopifyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const res = await fetch(`${supabaseUrl}/functions/v1/shopify-analytics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
      });
      
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Erreur ${res.status}: ${errBody}`);
      }
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">📊 Sleepzy Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Données Shopify en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    days === p.value ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Rafraîchir">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            <strong>Erreur:</strong> {error}
            <button onClick={fetchData} className="ml-3 underline">Réessayer</button>
          </div>
        )}

        {/* Loading state */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-500">Chargement des données Shopify…</span>
          </div>
        )}

        {data && (
          <>
            {/* KPI cards */}
            <SalesKPIs data={data} loading={loading} />

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                    activeTab === t.id ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "sales" && <SalesTab data={data} />}
            {activeTab === "traffic" && <TrafficTab />}
            {activeTab === "sources" && <SourcesTab />}
            {activeTab === "meta" && <MetaTab />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────── SALES KPIs ─────────── */
function SalesKPIs({ data, loading }: { data: ShopifyAnalytics; loading: boolean }) {
  const s = data.summary;
  const kpis = [
    { label: "Commandes", value: s.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-600" },
    { label: "Revenus", value: `${s.totalRevenue.toFixed(2)} ${s.currency}`, icon: DollarSign, color: "text-green-600" },
    { label: "Panier moyen", value: `${s.averageOrderValue.toFixed(2)} ${s.currency}`, icon: CreditCard, color: "text-violet-600" },
    { label: "Payées", value: s.paidOrders.toString(), icon: CreditCard, color: "text-green-500" },
    { label: "Remboursées", value: s.refundedOrders.toString(), icon: RefreshCw, color: "text-orange-500" },
    { label: "Annulées", value: s.cancelledOrders.toString(), icon: TrendingDown, color: "text-red-500" },
    { label: "Nouveaux clients", value: s.newCustomers.toString(), icon: Users, color: "text-cyan-600" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {kpis.map((k) => (
        <Card key={k.label} className={`bg-white shadow-sm border ${loading ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <k.icon className="h-3.5 w-3.5" />
              {k.label}
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ─────────── SALES TAB (LIVE from Shopify) ─────────── */
function SalesTab({ data }: { data: ShopifyAnalytics }) {
  // Orders by day chart data
  const chartData = Object.entries(data.ordersByDay)
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      orders: vals.orders,
      revenue: Math.round(vals.revenue * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Revenue chart */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Revenus par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value} ${data.summary.currency}`, "Revenu"]} />
                <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#gRev)" name="Revenu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Top Produits</CardTitle></CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune vente sur cette période</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-400 shrink-0">#{i + 1}</span>
                      <span className="text-sm truncate">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">{p.quantity} vendus</span>
                      <span className="text-sm font-semibold">{p.revenue.toFixed(2)} {data.summary.currency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top countries */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Commandes par pays</CardTitle></CardHeader>
          <CardContent>
            {data.topCountries.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune commande sur cette période</p>
            ) : (
              <div className="space-y-3">
                {data.topCountries.map((c, i) => (
                  <div key={c.code} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                      <span className="font-medium text-sm">{c.code}</span>
                    </div>
                    <span className="text-sm font-semibold">{c.count} commandes</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── TRAFFIC TAB (manual data — needs own tracking or Meta API) ─────────── */
function TrafficTab() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">Données de trafic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-gray-500">
          <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Données de trafic non disponibles via API</p>
          <p className="text-sm max-w-md mx-auto">
            Shopify ne permet pas d'accéder aux données de trafic (visiteurs, sessions, bounce rate) via API.
            Pour automatiser ces données, connecte l'<strong>API Meta Marketing</strong> ou implémente un tracking interne.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── SOURCES TAB (manual) ─────────── */
function SourcesTab() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">Sources de trafic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Sources non disponibles automatiquement</p>
          <p className="text-sm max-w-md mx-auto">
            Connecte l'<strong>API Meta Marketing</strong> pour récupérer les données de campagnes publicitaires,
            ou fournis tes captures d'écran pour une mise à jour manuelle.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── META ADS TAB (manual data) ─────────── */
function MetaTab() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-base">Événements Meta Pixel</CardTitle>
        <p className="text-sm text-gray-500">Pixel ID: 2093867758129616 — <span className="text-orange-500 font-medium">Données manuelles</span></p>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pixelEvents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="event" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {pixelEvents.map((e) => (
            <div key={e.event} className="flex justify-between text-sm border-b border-gray-50 pb-1">
              <span className="text-gray-600">{e.event}</span>
              <span className="font-semibold">{e.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
