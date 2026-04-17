import { useState, useEffect, useCallback } from "react";
import { Eye, ShoppingCart, FileText, Loader2, RefreshCw, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

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
  { id: "cart", label: "🛒 Ajouts panier" },
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
  const [activeTab, setActiveTab] = useState<TabId>("cart");
  const [days, setDays] = useState(30);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">📊 Sleepzy Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Données en temps réel</p>
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
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
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
        {activeTab === "cart" && <CartEventsTab days={days} />}
        {activeTab === "traffic" && <TrafficTab />}
        {activeTab === "sources" && <SourcesTab />}
        {activeTab === "meta" && <MetaTab />}
      </div>
    </div>
  );
}

/* ─────────── TRAFFIC TAB ─────────── */
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
            Pour automatiser ces données, connecte l'<strong>API Meta Marketing</strong> ou implémente un tracking interne.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── SOURCES TAB ─────────── */
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

/* ─────────── META ADS TAB ─────────── */
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

/* ─────────── CART EVENTS TAB (Live from DB) ─────────── */
function CartEventsTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayByBundle, setTodayByBundle] = useState<Array<{ label: string; count: number }>>([]);
  const [byDay, setByDay] = useState<Array<{ date: string; count: number }>>([]);
  const [byBundle, setByBundle] = useState<Array<{ label: string; count: number }>>([]);
  const [bySource, setBySource] = useState<Array<{ source: string; count: number }>>([]);
  const [todayBySource, setTodayBySource] = useState<Array<{ source: string; count: number }>>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCartEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('cart_events')
      .select('created_at, bundle_label, quantity, source')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.error('Cart events fetch error:', error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setTotal(data.length);

    const dayMap: Record<string, number> = {};
    const bundleMap: Record<string, number> = {};
    const todayBundleMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    const todaySourceMap: Record<string, number> = {};
    let todayCount = 0;

    const sourceLabel = (s: string | null) => {
      if (s === 'landing') return 'Landing page';
      if (s === 'product') return 'Page produit';
      if (s === 'other') return 'Autre page';
      return 'Inconnu (avant tracking)';
    };

    data.forEach((row: { created_at: string; bundle_label: string | null; quantity: number; source: string | null }) => {
      const createdAt = new Date(row.created_at);
      const day = createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dayMap[day] = (dayMap[day] || 0) + 1;
      const label = row.bundle_label || 'unknown';
      bundleMap[label] = (bundleMap[label] || 0) + 1;
      const src = sourceLabel(row.source);
      sourceMap[src] = (sourceMap[src] || 0) + 1;

      if (createdAt >= startOfToday) {
        todayCount += 1;
        todayBundleMap[label] = (todayBundleMap[label] || 0) + 1;
        todaySourceMap[src] = (todaySourceMap[src] || 0) + 1;
      }
    });

    setTodayTotal(todayCount);
    setTodayByBundle(
      Object.entries(todayBundleMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    );
    setTodayBySource(
      Object.entries(todaySourceMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
    );
    setByDay(Object.entries(dayMap).map(([date, count]) => ({ date, count })));
    setByBundle(
      Object.entries(bundleMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    );
    setBySource(
      Object.entries(sourceMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
    );
    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [days]);

  useEffect(() => {
    fetchCartEvents();
  }, [fetchCartEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Chargement des événements panier…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          {lastUpdate ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR')}` : '—'}
        </p>
        <button
          onClick={() => fetchCartEvents(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
        </button>
      </div>

      {/* Today highlight card */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-100 mb-1">
                <Calendar className="h-3.5 w-3.5" />
                Aujourd'hui ({new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })})
              </div>
              <p className="text-4xl font-bold">{todayTotal}</p>
              <p className="text-xs text-blue-100 mt-1">ajouts au panier depuis 00h00</p>
            </div>
            {todayByBundle.length > 0 && (
              <div className="text-xs space-y-1 min-w-[160px]">
                {todayByBundle.map((b) => (
                  <div key={b.label} className="flex justify-between gap-3 border-b border-white/20 pb-0.5">
                    <span className="text-blue-100">{b.label}</span>
                    <span className="font-semibold">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              Ajouts ({days}j)
            </div>
            <p className="text-2xl font-bold text-blue-600">{total}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              Moy. / jour
            </div>
            <p className="text-2xl font-bold text-green-600">{days > 0 ? (total / days).toFixed(1) : 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border">
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              Packs distincts
            </div>
            <p className="text-2xl font-bold text-violet-600">{byBundle.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Ajouts au panier par jour</CardTitle>
        </CardHeader>
        <CardContent>
          {byDay.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucun ajout au panier sur cette période</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={byDay}>
                  <defs>
                    <linearGradient id="gCart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, "Ajouts"]} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#gCart)" name="Ajouts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Répartition par pack</CardTitle>
        </CardHeader>
        <CardContent>
          {byBundle.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
          ) : (
            <>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBundle}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ajouts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {byBundle.map((b) => (
                  <div key={b.label} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                    <span className="text-gray-600">{b.label}</span>
                    <span className="font-semibold">{b.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
