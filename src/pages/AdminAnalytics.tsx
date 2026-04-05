import { useState } from "react";
import { Users, Eye, ShoppingCart, CreditCard, Clock, TrendingDown, FileText, Smartphone, Monitor, Tablet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

/* ── KPI data (update manually or connect to APIs later) ── */
const KPI = [
  { label: "Visiteurs", value: "211", icon: Users, color: "text-foreground" },
  { label: "Pages vues", value: "347", icon: Eye, color: "text-foreground" },
  { label: "Ajouts panier", value: "12", icon: ShoppingCart, color: "text-orange-500" },
  { label: "Checkout", value: "13", icon: CreditCard, color: "text-violet-500" },
  { label: "Durée session", value: "48s", icon: Clock, color: "text-foreground" },
  { label: "Taux rebond", value: "82%", icon: TrendingDown, color: "text-foreground" },
  { label: "Pages/visite", value: "1.64", icon: FileText, color: "text-foreground" },
];

/* ── Traffic data (last 14 days sample) ── */
const trafficData = [
  { date: "23/03", visitors: 8, pageViews: 12 },
  { date: "24/03", visitors: 5, pageViews: 9 },
  { date: "25/03", visitors: 12, pageViews: 20 },
  { date: "26/03", visitors: 15, pageViews: 25 },
  { date: "27/03", visitors: 10, pageViews: 18 },
  { date: "28/03", visitors: 18, pageViews: 30 },
  { date: "29/03", visitors: 22, pageViews: 35 },
  { date: "30/03", visitors: 14, pageViews: 22 },
  { date: "31/03", visitors: 20, pageViews: 32 },
  { date: "01/04", visitors: 25, pageViews: 40 },
  { date: "02/04", visitors: 18, pageViews: 28 },
  { date: "03/04", visitors: 16, pageViews: 26 },
  { date: "04/04", visitors: 30, pageViews: 50 },
  { date: "05/04", visitors: 12, pageViews: 20 },
];

/* ── Device split ── */
const deviceData = [
  { name: "Mobile", value: 62, color: "#6366f1" },
  { name: "Desktop", value: 34, color: "#06b6d4" },
  { name: "Tablet", value: 4, color: "#f59e0b" },
];
const DEVICE_ICONS: Record<string, React.ElementType> = { Mobile: Smartphone, Desktop: Monitor, Tablet: Tablet };

/* ── Top countries ── */
const topCountries = [
  { rank: 1, code: "US", count: 142 },
  { rank: 2, code: "FR", count: 28 },
  { rank: 3, code: "GB", count: 12 },
  { rank: 4, code: "CA", count: 9 },
  { rank: 5, code: "DE", count: 6 },
];

/* ── Top pages ── */
const topPages = [
  { path: "/", views: 211 },
  { path: "/product/sleepzy-anti-embarrassment-travel-pillow", views: 89 },
  { path: "/product/pack-duo", views: 34 },
  { path: "/terms", views: 8 },
  { path: "/shipping", views: 5 },
];

/* ── Meta Pixel events ── */
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
  { id: "traffic", label: "📈 Trafic" },
  { id: "sources", label: "🔗 Sources" },
  { id: "sales", label: "💰 Ventes" },
  { id: "meta", label: "📱 Meta Ads" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState<TabId>("traffic");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">📊 Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Données depuis le 23 mars 2026</p>
          </div>
          <p className="text-xs text-gray-400">Dernière mise à jour : 05/04/2026</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {KPI.map((k) => (
            <Card key={k.label} className="bg-white shadow-sm border">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <k.icon className="h-3.5 w-3.5" />
                  {k.label}
                </div>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
        {activeTab === "traffic" && <TrafficTab />}
        {activeTab === "sources" && <SourcesTab />}
        {activeTab === "sales" && <SalesTab />}
        {activeTab === "meta" && <MetaTab />}
      </div>
    </div>
  );
}

/* ─────────── TRAFFIC TAB ─────────── */
function TrafficTab() {
  return (
    <div className="space-y-6">
      {/* Area chart */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Évolution du trafic (par jour)</CardTitle>
          <p className="text-sm text-gray-500">Total période : <strong>211 visiteurs</strong> • <strong>347 pages vues</strong></p>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="visitors" stroke="#06b6d4" fill="url(#gV)" name="Visiteurs" />
                <Area type="monotone" dataKey="pageViews" stroke="#6366f1" fill="url(#gP)" name="Pages vues" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Device pie */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Répartition par appareil</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                    {deviceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {deviceData.map((d) => {
                const Icon = DEVICE_ICONS[d.name];
                return (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                    {d.name}: {Math.round(211 * d.value / 100)}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top countries */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Top Pays</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topCountries.map((c) => (
              <div key={c.code} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">#{c.rank}</span>
                  <span className="font-medium text-sm">{c.code}</span>
                </div>
                <span className="text-sm font-semibold">{c.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card className="bg-white">
          <CardHeader><CardTitle className="text-base">Top Pages</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="path" type="category" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── SOURCES TAB ─────────── */
function SourcesTab() {
  const sources = [
    { source: "Direct", visitors: 85, pct: "40%" },
    { source: "Meta Ads (Facebook/Instagram)", visitors: 78, pct: "37%" },
    { source: "Google Organic", visitors: 25, pct: "12%" },
    { source: "Social (TikTok, Reddit, etc.)", visitors: 15, pct: "7%" },
    { source: "Referral", visitors: 8, pct: "4%" },
  ];

  return (
    <Card className="bg-white">
      <CardHeader><CardTitle className="text-base">Sources de trafic</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s.source} className="flex items-center justify-between">
              <span className="text-sm">{s.source}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: s.pct }} />
                </div>
                <span className="text-sm font-semibold w-12 text-right">{s.visitors}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{s.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────── SALES TAB ─────────── */
function SalesTab() {
  const funnelData = [
    { stage: "Visiteurs", count: 211, pct: "100%" },
    { stage: "Page produit", count: 123, pct: "58.3%" },
    { stage: "Ajout panier", count: 12, pct: "5.7%" },
    { stage: "Checkout", count: 13, pct: "6.2%" },
    { stage: "Achat", count: 0, pct: "0%" },
  ];

  return (
    <Card className="bg-white">
      <CardHeader><CardTitle className="text-base">Funnel de conversion</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((f, i) => (
            <div key={f.stage}>
              <div className="flex justify-between text-sm mb-1">
                <span>{f.stage}</span>
                <span className="font-semibold">{f.count} <span className="text-gray-400 font-normal">({f.pct})</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${(f.count / 211) * 100}%`,
                    backgroundColor: i === 0 ? "#06b6d4" : i === 1 ? "#6366f1" : i === 2 ? "#f59e0b" : i === 3 ? "#8b5cf6" : "#ef4444",
                  }}
                />
              </div>
            </div>
          ))}
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
        <p className="text-sm text-gray-500">Pixel ID: 2093867758129616</p>
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
