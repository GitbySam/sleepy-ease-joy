import { useState, useEffect, useCallback } from "react";
import { Eye, ShoppingCart, FileText, Loader2, RefreshCw, Calendar, DollarSign, AlertCircle, AlertTriangle, MousePointerClick, Bug, Zap, TrendingDown } from "lucide-react";
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
  { id: "funnel", label: "🎯 Funnel" },
  { id: "checkout", label: "🔍 Funnel Checkout" },
  { id: "frictions", label: "⚠️ Frictions" },
  { id: "sales", label: "💰 Ventes Shopify" },
  { id: "traffic", label: "📈 Trafic" },
  { id: "sources", label: "🔗 Sources" },
  { id: "meta", label: "📱 Meta Ads" },
  { id: "attribution", label: "🎯 Attribution" },
  { id: "attributed_sales", label: "🧾 Ventes attribuées" },
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
        {activeTab === "funnel" && <FunnelTab days={days} />}
        {activeTab === "checkout" && <CheckoutFunnelTab days={days} />}
        {activeTab === "frictions" && <FrictionsTab days={days} />}
        {activeTab === "sales" && <SalesTab days={days} />}
        {activeTab === "traffic" && <TrafficTab />}
        {activeTab === "sources" && <SourcesTab />}
        {activeTab === "meta" && <MetaTab />}
        {activeTab === "attribution" && <AttributionTab days={days} />}
        {activeTab === "attributed_sales" && <AttributedSalesTab days={days} />}
      </div>
    </div>
  );
}

/* ─────────── ATTRIBUTED SALES TAB ───────────
 * Pour chaque commande Shopify de la période, affiche la source / campagne /
 * créatif (utm_content) issue des note_attributes posés sur le cart au
 * moment du checkout. Permet d'identifier précisément quelle pub a généré
 * la vente — fallback "Direct/Inconnu" si aucun UTM n'est présent.
 */
type AttributedOrder = {
  id: number;
  name: string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status: string | null;
  email: string | null;
  visitor_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  landing_site: string | null;
  referring_site: string | null;
};

function AttributedSalesTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AttributedOrder[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-analytics?days=${days}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const list: AttributedOrder[] = json.attributedOrders || [];
      // newest first
      list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Chargement des ventes attribuées…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-2 border-red-200">
        <CardContent className="p-6 text-sm text-red-700">{error}</CardContent>
      </Card>
    );
  }

  const attributed = orders.filter((o) => o.utm_source || o.utm_campaign || o.fbclid);
  const direct = orders.length - attributed.length;
  const paid = orders.filter((o) => o.financial_status === 'paid' || o.financial_status === 'partially_paid');

  const metaSearchUrl = (q: string) =>
    `https://adsmanager.facebook.com/adsmanager/manage/ads?act=&search=${encodeURIComponent(q)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          Période : {days} derniers jours · {orders.length} commandes ({paid.length} payées)
        </p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Commandes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Attribuées</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{attributed.length}</p>
          <p className="text-xs text-gray-400 mt-1">{orders.length ? `${((attributed.length / orders.length) * 100).toFixed(0)} %` : '—'}</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Direct / Inconnu</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{direct}</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Payées</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{paid.length}</p>
        </CardContent></Card>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Commande</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Campagne</th>
                <th className="px-4 py-3 text-left">Ad Set (utm_term)</th>
                <th className="px-4 py-3 text-left">Créatif (utm_content)</th>
                <th className="px-4 py-3 text-left">Meta</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-400">Aucune commande</td></tr>
              )}
              {orders.map((o) => {
                const isDirect = !o.utm_source && !o.utm_campaign && !o.fbclid;
                const source = o.utm_source || (o.fbclid ? 'facebook' : 'direct');
                return (
                  <tr key={o.id} className={`border-t border-gray-100 ${isDirect ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString('fr-CA')}<br/>
                      <span className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <a
                        href={`https://admin.shopify.com/store/sleepenzy/orders/${o.id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >{o.name}</a>
                      {o.email && <div className="text-xs text-gray-400 truncate max-w-[180px]">{o.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      {parseFloat(o.total_price).toFixed(2)} {o.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        o.financial_status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                        : o.financial_status === 'refunded' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>{o.financial_status || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isDirect ? (
                        <span className="text-gray-400 italic">Direct / Inconnu</span>
                      ) : (
                        <span className="font-medium text-gray-800">{source}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate" title={o.utm_campaign || ''}>
                      {o.utm_campaign || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate" title={o.utm_term || ''}>
                      {o.utm_term || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={o.utm_content || ''}>
                      {o.utm_content || (o.fbclid ? <span className="text-xs text-gray-400">fbclid uniquement</span> : '—')}
                    </td>
                    <td className="px-4 py-3">
                      {o.utm_content ? (
                        <a
                          href={metaSearchUrl(o.utm_content)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >Voir l'ad ↗</a>
                      ) : o.utm_campaign ? (
                        <a
                          href={metaSearchUrl(o.utm_campaign)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >Voir campagne ↗</a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900">
        💡 Les ventes <strong>Direct / Inconnu</strong> sont des commandes pour lesquelles aucun UTM ni <code>fbclid</code> n'a été capturé au moment du checkout (lien partagé, app iOS, navigation manuelle…). Configure <code>utm_term=&#123;&#123;adset.name&#125;&#125;</code> dans Meta Ads pour aussi remonter le nom de l'ad set.
      </div>
    </div>
  );
}

/* ─────────── ATTRIBUTION TAB ─────────── */
type AttribRow = {
  visitor_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fbclid: string | null;
};

function classifySource(r: { utm_source: string | null; fbclid: string | null }): string {
  if (r.utm_source) return r.utm_source.toLowerCase();
  if (r.fbclid) return 'facebook';
  return 'direct';
}

function AttributionTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AttribRow[]>([]);
  const [carts, setCarts] = useState<AttribRow[]>([]);
  const [checkouts, setCheckouts] = useState<AttribRow[]>([]);
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sinceISO = new Date(Date.now() - days * 86400000).toISOString();
      const [sRes, cRes, kRes] = await Promise.all([
        supabase.from('funnel_events')
          .select('visitor_id, utm_source, utm_medium, utm_campaign, utm_content, fbclid')
          .eq('step', 'session_landing')
          .gte('created_at', sinceISO),
        supabase.from('cart_events')
          .select('visitor_id, utm_source, utm_medium, utm_campaign, utm_content, fbclid')
          .gte('created_at', sinceISO),
        supabase.from('checkout_events')
          .select('visitor_id, utm_source, utm_medium, utm_campaign, utm_content, fbclid')
          .gte('created_at', sinceISO),
      ]);
      if (sRes.error || cRes.error || kRes.error) {
        throw new Error((sRes.error || cRes.error || kRes.error)?.message || 'fetch failed');
      }
      setSessions((sRes.data || []) as AttribRow[]);
      setCarts((cRes.data || []) as AttribRow[]);
      setCheckouts((kRes.data || []) as AttribRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Chargement de l'attribution…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-2 border-red-200">
        <CardContent className="p-6 text-sm text-red-700">{error}</CardContent>
      </Card>
    );
  }

  // ── KPIs by source ──
  const sourceMap = new Map<string, { sessions: Set<string>; carts: Set<string>; checkouts: Set<string> }>();
  const ensure = (k: string) => {
    if (!sourceMap.has(k)) sourceMap.set(k, { sessions: new Set(), carts: new Set(), checkouts: new Set() });
    return sourceMap.get(k)!;
  };
  sessions.forEach((r) => {
    if (!r.visitor_id) return;
    ensure(classifySource(r)).sessions.add(r.visitor_id);
  });
  carts.forEach((r) => {
    if (!r.visitor_id) return;
    ensure(classifySource(r)).carts.add(r.visitor_id);
  });
  checkouts.forEach((r) => {
    if (!r.visitor_id) return;
    ensure(classifySource(r)).checkouts.add(r.visitor_id);
  });
  const sourceRows = Array.from(sourceMap.entries())
    .map(([source, v]) => ({
      source,
      sessions: v.sessions.size,
      carts: v.carts.size,
      checkouts: v.checkouts.size,
      cartRate: v.sessions.size ? (v.carts.size / v.sessions.size) * 100 : 0,
      coRate: v.sessions.size ? (v.checkouts.size / v.sessions.size) * 100 : 0,
    }))
    .sort((a, b) => b.checkouts - a.checkouts || b.sessions - a.sessions);

  const totalSessions = sessions.length;
  const paidSessions = sessions.filter((r) => r.utm_medium === 'paid' || r.fbclid).length;

  // ── Campaign breakdown ──
  const campaignMap = new Map<string, { source: string; sessions: Set<string>; carts: Set<string>; checkouts: Set<string> }>();
  const ensureC = (k: string, source: string) => {
    if (!campaignMap.has(k)) campaignMap.set(k, { source, sessions: new Set(), carts: new Set(), checkouts: new Set() });
    return campaignMap.get(k)!;
  };
  sessions.forEach((r) => {
    if (!r.visitor_id || !r.utm_campaign) return;
    ensureC(r.utm_campaign, classifySource(r)).sessions.add(r.visitor_id);
  });
  carts.forEach((r) => {
    if (!r.visitor_id || !r.utm_campaign) return;
    ensureC(r.utm_campaign, classifySource(r)).carts.add(r.visitor_id);
  });
  checkouts.forEach((r) => {
    if (!r.visitor_id || !r.utm_campaign) return;
    ensureC(r.utm_campaign, classifySource(r)).checkouts.add(r.visitor_id);
  });
  const campaignRows = Array.from(campaignMap.entries())
    .map(([campaign, v]) => ({
      campaign,
      source: v.source,
      sessions: v.sessions.size,
      carts: v.carts.size,
      checkouts: v.checkouts.size,
      cartRate: v.sessions.size ? (v.carts.size / v.sessions.size) * 100 : 0,
      coRate: v.sessions.size ? (v.checkouts.size / v.sessions.size) * 100 : 0,
    }))
    .sort((a, b) => b.checkouts - a.checkouts || b.sessions - a.sessions);

  // ── Creative drilldown (utm_content) for selected campaign ──
  let creativeRows: Array<{ creative: string; sessions: number; carts: number; checkouts: number }> = [];
  if (drilldown) {
    const creativeMap = new Map<string, { sessions: Set<string>; carts: Set<string>; checkouts: Set<string> }>();
    const ensureK = (k: string) => {
      if (!creativeMap.has(k)) creativeMap.set(k, { sessions: new Set(), carts: new Set(), checkouts: new Set() });
      return creativeMap.get(k)!;
    };
    sessions.forEach((r) => {
      if (r.utm_campaign !== drilldown || !r.visitor_id) return;
      ensureK(r.utm_content || '(sans nom)').sessions.add(r.visitor_id);
    });
    carts.forEach((r) => {
      if (r.utm_campaign !== drilldown || !r.visitor_id) return;
      ensureK(r.utm_content || '(sans nom)').carts.add(r.visitor_id);
    });
    checkouts.forEach((r) => {
      if (r.utm_campaign !== drilldown || !r.visitor_id) return;
      ensureK(r.utm_content || '(sans nom)').checkouts.add(r.visitor_id);
    });
    creativeRows = Array.from(creativeMap.entries())
      .map(([creative, v]) => ({
        creative,
        sessions: v.sessions.size,
        carts: v.carts.size,
        checkouts: v.checkouts.size,
      }))
      .sort((a, b) => b.checkouts - a.checkouts || b.sessions - a.sessions);
  }

  const noAttribution = sourceRows.find((r) => r.source === 'direct');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          Période : {days} derniers jours · {sessions.length} sessions trackées
        </p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sessions totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalSessions}</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sessions payantes</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{paidSessions}</p>
          <p className="text-xs text-gray-400 mt-1">{totalSessions ? `${((paidSessions / totalSessions) * 100).toFixed(1)} % du total` : '—'}</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Sans attribution (direct)</p>
          <p className="text-3xl font-bold text-gray-700 mt-1">{noAttribution?.sessions ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">organique / direct / bookmark</p>
        </CardContent></Card>
        <Card className="bg-white"><CardContent className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Campagnes actives</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{campaignRows.length}</p>
        </CardContent></Card>
      </div>

      {/* By source */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📡 Performance par source</h3>
        <Card className="bg-white">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Ajouts panier</th>
                  <th className="px-4 py-3 text-right">Checkouts</th>
                  <th className="px-4 py-3 text-right">Taux panier</th>
                  <th className="px-4 py-3 text-right">Taux checkout</th>
                </tr>
              </thead>
              <tbody>
                {sourceRows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Aucune donnée</td></tr>
                )}
                {sourceRows.map((r) => (
                  <tr key={r.source} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.source}</td>
                    <td className="px-4 py-3 text-right">{r.sessions}</td>
                    <td className="px-4 py-3 text-right">{r.carts}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{r.checkouts}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.cartRate.toFixed(1)} %</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.coRate.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* By campaign */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Performance par campagne</h3>
        <Card className="bg-white">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Campagne</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Ajouts panier</th>
                  <th className="px-4 py-3 text-right">Checkouts</th>
                  <th className="px-4 py-3 text-right">Taux panier</th>
                  <th className="px-4 py-3 text-right">Taux checkout</th>
                </tr>
              </thead>
              <tbody>
                {campaignRows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    Aucune campagne détectée. Configure les UTM dans Meta Ads Manager.
                  </td></tr>
                )}
                {campaignRows.map((r) => (
                  <tr
                    key={r.campaign}
                    onClick={() => setDrilldown(drilldown === r.campaign ? null : r.campaign)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-blue-50 ${drilldown === r.campaign ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{r.campaign}</td>
                    <td className="px-4 py-3 text-gray-600">{r.source}</td>
                    <td className="px-4 py-3 text-right">{r.sessions}</td>
                    <td className="px-4 py-3 text-right">{r.carts}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{r.checkouts}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.cartRate.toFixed(1)} %</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.coRate.toFixed(1)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {campaignRows.length > 0 && (
          <p className="text-xs text-gray-400 mt-2">💡 Clique sur une campagne pour voir le détail par créatif.</p>
        )}
      </div>

      {/* Creative drilldown */}
      {drilldown && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            🎨 Créatifs — campagne « {drilldown} »
          </h3>
          <Card className="bg-white">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Créatif (utm_content)</th>
                    <th className="px-4 py-3 text-right">Sessions</th>
                    <th className="px-4 py-3 text-right">Ajouts panier</th>
                    <th className="px-4 py-3 text-right">Checkouts</th>
                  </tr>
                </thead>
                <tbody>
                  {creativeRows.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Aucun utm_content détaillé</td></tr>
                  )}
                  {creativeRows.map((r) => (
                    <tr key={r.creative} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.creative}</td>
                      <td className="px-4 py-3 text-right">{r.sessions}</td>
                      <td className="px-4 py-3 text-right">{r.carts}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{r.checkouts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Help */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">💡 Configurer Meta Ads pour un suivi précis</p>
        <p className="text-xs mb-2">
          Dans Meta Ads Manager, ouvre ton ad set → niveau Annonce → champ <strong>« Paramètres d'URL »</strong> et colle :
        </p>
        <pre className="text-xs bg-white border border-amber-200 rounded p-2 overflow-x-auto">
utm_source=facebook&amp;utm_medium=paid&amp;utm_campaign=&#123;&#123;campaign.name&#125;&#125;&amp;utm_content=&#123;&#123;ad.name&#125;&#125;&amp;utm_term=&#123;&#123;adset.name&#125;&#125;
        </pre>
        <p className="text-xs mt-2">
          Les noms réels des campagnes / ad sets / créatifs remonteront automatiquement ici. À défaut d'UTM, on retombe sur <code>fbclid</code> (présent sur tous les clics Meta).
        </p>
      </div>
    </div>
  );
}

/* ─────────── CHECKOUT FUNNEL TAB ───────────
 * Croise funnel_events.click_checkout (notre site) avec
 * shopify-analytics (abandoned + paid orders) pour identifier
 * où exactement les visiteurs abandonnent.
 */
function CheckoutFunnelTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clicks, setClicks] = useState<number>(0);
  const [opened, setOpened] = useState<number>(0);
  const [blocked, setBlocked] = useState<number>(0);
  const [shopify, setShopify] = useState<ShopifyResult | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Fetch Shopify analytics + funnel clicks/opens/blocks in parallel
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const [shopifyRes, clicksRes, openedRes, blockedRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-analytics?days=${days}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }).then(async (r) => {
          const payload = await r.json().catch(() => ({} as ShopifyAnalyticsError));
          return r.ok ? payload : { ...payload, error: formatShopifyAnalyticsError(payload, r.status) };
        }),
        supabase
          .from('funnel_events')
          .select('id', { count: 'exact', head: true })
          .eq('step', 'click_checkout')
          .gte('created_at', sinceISO),
        supabase
          .from('funnel_events')
          .select('id', { count: 'exact', head: true })
          .eq('step', 'checkout_opened')
          .gte('created_at', sinceISO),
        supabase
          .from('funnel_events')
          .select('id', { count: 'exact', head: true })
          .eq('step', 'checkout_popup_blocked')
          .gte('created_at', sinceISO),
      ]);

      if (shopifyRes.error) {
        setError(formatShopifyAnalyticsError(shopifyRes as ShopifyAnalyticsError));
      } else {
        setShopify(shopifyRes as ShopifyResult);
      }
      setClicks(clicksRes.count ?? 0);
      setOpened(openedRes.count ?? 0);
      setBlocked(blockedRes.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Analyse du funnel checkout…</span>
      </div>
    );
  }

  if (error || !shopify) {
    return (
      <Card className="bg-white border-2 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Impossible de charger le funnel checkout</h3>
              <p className="text-sm text-red-700">{error ?? 'Données indisponibles'}</p>
              <button
                onClick={fetchAll}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Réessayer
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const s = shopify.summary;
  const currencySymbol = s.currency === 'USD' ? '$' : s.currency === 'EUR' ? '€' : s.currency === 'CAD' ? '$' : s.currency;

  // 4 étapes du funnel
  const stepClicks = clicks;
  const stepReached = s.abandonedCount + s.paidOrders; // tous ceux qui ont créé un checkout Shopify
  const stepEmail = s.abandonedWithEmail + s.paidOrders;
  const stepPaid = s.paidOrders;

  // Drop-offs (en %)
  const dropBeforeShopify = stepClicks > 0 ? ((stepClicks - stepReached) / stepClicks) * 100 : 0;
  const dropOnLanding = stepReached > 0 ? ((stepReached - stepEmail) / stepReached) * 100 : 0;
  const dropDuringPay = stepEmail > 0 ? ((stepEmail - stepPaid) / stepEmail) * 100 : 0;

  // Pourcentage par rapport au début (clics)
  const pctReached = stepClicks > 0 ? (stepReached / stepClicks) * 100 : 0;
  const pctEmail = stepClicks > 0 ? (stepEmail / stepClicks) * 100 : 0;
  const pctPaid = stepClicks > 0 ? (stepPaid / stepClicks) * 100 : 0;

  // Verdict : la plus grosse fuite
  const drops = [
    { key: 'before', label: 'Avant Shopify', value: dropBeforeShopify, count: stepClicks - stepReached },
    { key: 'landing', label: 'Sur la landing checkout', value: dropOnLanding, count: stepReached - stepEmail },
    { key: 'pay', label: 'En cours de paiement', value: dropDuringPay, count: stepEmail - stepPaid },
  ];
  const dominant = drops.reduce((a, b) => (b.value > a.value ? b : a), drops[0]);

  const dropColor = (v: number) =>
    v >= 50 ? 'border-red-300 bg-red-50' : v >= 30 ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50';
  const dropTextColor = (v: number) =>
    v >= 50 ? 'text-red-700' : v >= 30 ? 'text-amber-700' : 'text-emerald-700';

  const verdictText: Record<string, { title: string; desc: string; action: string }> = {
    before: {
      title: 'Bounce avant même Shopify',
      desc: 'La majorité des visiteurs cliquent sur "checkout" mais n\'arrivent jamais sur la page de paiement Shopify.',
      action: 'Causes probables : popup bloquante (window.open bloqué par le navigateur), redirection cassée, fermeture immédiate de l\'onglet. À investiguer côté code de redirection.',
    },
    landing: {
      title: 'Bounce sur la landing du checkout',
      desc: 'Les visiteurs arrivent sur Shopify mais repartent sans même remplir leur email.',
      action: 'Cause #1 universelle : choc des frais de port et de la devise. Solution : afficher clairement les frais et la devise AVANT le clic checkout, sur la page produit / dans le panier.',
    },
    pay: {
      title: 'Abandon en cours de paiement',
      desc: 'Les visiteurs ont rempli leur email mais n\'ont pas finalisé le paiement.',
      action: 'Causes : carte refusée, hésitation dernière minute, comparaison de prix. La page checkout Shopify est une boîte noire — active "Abandoned Checkout Recovery" dans Shopify pour récupérer ~10% par email.',
    },
  };
  const verdict = verdictText[dominant.key];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          Période : {days} derniers jours
          <span className="ml-2 text-emerald-600">● Croisement funnel_events × Shopify Admin API</span>
        </p>
        <button
          onClick={fetchAll}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </button>
      </div>

      {/* Ouverture checkout (popup nouvel onglet vs blocage) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🪟 Ouverture du checkout</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-white border-2 border-emerald-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Popup ouvert (nouvel onglet)</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{opened}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stepClicks > 0 ? `${((opened / stepClicks) * 100).toFixed(1)} % des clics` : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Popup bloqué (fallback même onglet)</p>
              <p className="text-3xl font-bold text-amber-700 mt-1">{blocked}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stepClicks > 0 ? `${((blocked / stepClicks) * 100).toFixed(1)} % des clics` : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Taux de blocage</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {opened + blocked > 0 ? `${((blocked / (opened + blocked)) * 100).toFixed(1)} %` : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">blocked / (opened + blocked)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4 étapes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">1. Clics checkout</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stepClicks}</p>
            <p className="text-xs text-gray-400 mt-1">100 % (référence)</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">2. Page Shopify atteinte</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stepReached}</p>
            <p className="text-xs text-gray-400 mt-1">{pctReached.toFixed(1)} % des clics</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">3. Email saisi</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stepEmail}</p>
            <p className="text-xs text-gray-400 mt-1">{pctEmail.toFixed(1)} % des clics</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">4. Paiement réussi</p>
            <p className="text-3xl font-bold text-emerald-700 mt-1">{stepPaid}</p>
            <p className="text-xs text-gray-400 mt-1">{pctPaid.toFixed(1)} % des clics</p>
          </CardContent>
        </Card>
      </div>

      {/* 3 drops */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingDown className="h-4 w-4" /> Où sont les fuites ?
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className={`border-2 ${dropColor(dropBeforeShopify)}`}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Drop 1 → 2</p>
              <p className={`text-3xl font-bold mt-1 ${dropTextColor(dropBeforeShopify)}`}>
                {dropBeforeShopify.toFixed(1)} %
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {Math.max(0, stepClicks - stepReached)} visiteurs perdus avant Shopify
              </p>
              <p className="text-xs text-gray-500 mt-2 leading-snug">
                Le client clique mais n'arrive jamais sur la page de paiement. Causes typiques : popup bloquée, problème réseau, fermeture immédiate.
              </p>
            </CardContent>
          </Card>
          <Card className={`border-2 ${dropColor(dropOnLanding)}`}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Drop 2 → 3</p>
              <p className={`text-3xl font-bold mt-1 ${dropTextColor(dropOnLanding)}`}>
                {dropOnLanding.toFixed(1)} %
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {Math.max(0, stepReached - stepEmail)} visiteurs perdus sur la landing
              </p>
              <p className="text-xs text-gray-500 mt-2 leading-snug">
                Arrivé sur Shopify, repart sans remplir son email. Cause #1 : choc des frais de port, devise inattendue.
              </p>
            </CardContent>
          </Card>
          <Card className={`border-2 ${dropColor(dropDuringPay)}`}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Drop 3 → 4</p>
              <p className={`text-3xl font-bold mt-1 ${dropTextColor(dropDuringPay)}`}>
                {dropDuringPay.toFixed(1)} %
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {Math.max(0, stepEmail - stepPaid)} visiteurs perdus en paiement
              </p>
              <p className="text-xs text-gray-500 mt-2 leading-snug">
                A rempli son email mais n'a pas payé. Causes : carte refusée, hésitation, comparaison de prix.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verdict */}
      {stepClicks > 0 && (
        <Card className="bg-blue-50 border-2 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-600 p-2 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                  Cause dominante de l'abandon
                </p>
                <h3 className="text-lg font-bold text-blue-900 mb-2">{verdict.title}</h3>
                <p className="text-sm text-blue-900 mb-2">{verdict.desc}</p>
                <p className="text-sm text-blue-800">
                  <strong>Action recommandée :</strong> {verdict.action}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stepClicks === 0 && (
        <Card className="bg-amber-50 border-2 border-amber-200">
          <CardContent className="p-5 text-sm text-amber-900">
            Aucun clic checkout enregistré sur la période. Élargis la période ou vérifie que le tracking <code className="bg-amber-100 px-1 rounded">click_checkout</code> est actif.
          </CardContent>
        </Card>
      )}

      {/* Liste des derniers abandons avec email */}
      {shopify.abandonedCheckouts.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              📧 Derniers abandons avec email ({s.abandonedWithEmail})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shopify.abandonedCheckouts.slice(0, 10).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.email ?? '— sans email —'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleString('fr-FR')} • {c.line_items_count} article(s)
                    </p>
                  </div>
                  <p className="font-semibold text-amber-700 ml-3">
                    {currencySymbol}{parseFloat(c.total_price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Note méthodo */}
      <div className="rounded-lg bg-gray-100 border border-gray-200 p-4 text-xs text-gray-600">
        <p className="font-semibold mb-1 text-gray-700">📐 Méthodologie</p>
        <ul className="space-y-1 list-disc pl-5">
          <li><strong>Clics checkout</strong> = événements <code className="bg-white px-1 rounded">funnel_events.step = 'click_checkout'</code> sur le site.</li>
          <li><strong>Popup ouvert</strong> = <code className="bg-white px-1 rounded">checkout_opened</code> (nouvel onglet OK) — <strong>Popup bloqué</strong> = <code className="bg-white px-1 rounded">checkout_popup_blocked</code> (fallback même onglet). Métadonnée <code className="bg-white px-1 rounded">latencyMs</code> disponible par événement.</li>
          <li><strong>Page Shopify atteinte</strong> = abandoned_checkouts + commandes payées (Shopify ne crée un checkout que si la page se charge).</li>
          <li><strong>Email saisi</strong> = abandons avec email + commandes payées.</li>
          <li><strong>Paiement réussi</strong> = commandes au statut <code className="bg-white px-1 rounded">paid</code>.</li>
          <li>Les chiffres ne sont pas attribués individuellement (anonyme), mais agrégés sur la période.</li>
        </ul>
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
  const [last7Days, setLast7Days] = useState<Array<{ date: string; label: string; count: number }>>([]);
  const [last7Total, setLast7Total] = useState(0);
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

    // For 7-day rolling window we always query at least 7 days back
    const sinceFor7 = new Date();
    sinceFor7.setDate(sinceFor7.getDate() - 7);
    const queryStart = sinceFor7 < since ? sinceFor7 : since;

    const { data, error } = await supabase
      .from('cart_events')
      .select('created_at, bundle_label, quantity, source, user_agent, referrer')
      .gte('created_at', queryStart.toISOString())
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.error('Cart events fetch error:', error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const dayMap: Record<string, number> = {};
    const bundleMap: Record<string, number> = {};
    const todayBundleMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    const todaySourceMap: Record<string, number> = {};
    let todayCount = 0;
    let periodCount = 0;

    const sourceLabel = (s: string | null) => {
      if (s === 'landing') return 'Landing page';
      if (s === 'product') return 'Page produit';
      if (s === 'other') return 'Autre page';
      return 'Inconnu (avant tracking)';
    };

    // Build a per-day count map indexed by LOCAL date (YYYY-MM-DD) so it matches
    // "today" computed from new Date() in the user's browser timezone.
    const dayLocalMap: Record<string, number> = {};
    const localDayKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Exclude internal preview traffic (Lovable editor) and known bot UAs
    const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pingdom|gtmetrix|uptimerobot|ahrefs|semrush|petalbot/i;
    const isInternalOrBot = (row: { user_agent?: string | null; referrer?: string | null }) => {
      const ref = (row.referrer || '').toLowerCase();
      if (ref.includes('lovable.dev') || ref.includes('lovable.app')) return true;
      const ua = row.user_agent || '';
      if (BOT_UA_RE.test(ua)) return true;
      return false;
    };

    data.forEach((row: { created_at: string; bundle_label: string | null; quantity: number; source: string | null; user_agent: string | null; referrer: string | null }) => {
      if (isInternalOrBot(row)) return;
      const createdAt = new Date(row.created_at);
      const localDay = localDayKey(createdAt);
      dayLocalMap[localDay] = (dayLocalMap[localDay] || 0) + 1;

      // Only aggregate into period stats if within selected `days` window
      if (createdAt < since) return;
      periodCount += 1;

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

    setTotal(periodCount);

    // Build last 7 days array (rolling), filling zeros for missing days
    const rolling: Array<{ date: string; label: string; count: number }> = [];
    let rollingTotal = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = localDayKey(d);
      const count = dayLocalMap[key] || 0;
      rollingTotal += count;
      const label = i === 0
        ? "Aujourd'hui"
        : d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      rolling.push({ date: key, label, count });
    }
    setLast7Days(rolling);
    setLast7Total(rollingTotal);

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

  // Auto-refresh every 30 seconds (silent, no spinner)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCartEvents(true);
    }, 30000);
    return () => clearInterval(interval);
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
                <p className="text-blue-200 uppercase tracking-wider text-[10px] mb-1">Par pack</p>
                {todayByBundle.map((b) => (
                  <div key={b.label} className="flex justify-between gap-3 border-b border-white/20 pb-0.5">
                    <span className="text-blue-100">{b.label}</span>
                    <span className="font-semibold">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
            {todayBySource.length > 0 && (
              <div className="text-xs space-y-1 min-w-[180px]">
                <p className="text-blue-200 uppercase tracking-wider text-[10px] mb-1">Par page d'origine</p>
                {todayBySource.map((s) => (
                  <div key={s.source} className="flex justify-between gap-3 border-b border-white/20 pb-0.5">
                    <span className="text-blue-100">{s.source}</span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 7 jours glissants */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">📅 Ajouts panier — 7 derniers jours glissants</CardTitle>
              <p className="text-xs text-gray-500 mt-1">Vue jour par jour incluant aujourd'hui</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Total 7j</p>
              <p className="text-2xl font-bold text-blue-600">{last7Total}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, "Ajouts"]}
                  labelFormatter={(label: string) => label}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ajouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {last7Days.map((d) => (
              <div key={d.date} className={`rounded-md p-2 ${d.count > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <p className="text-[10px] text-gray-500 truncate">{d.label}</p>
                <p className={`text-sm font-bold ${d.count > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{d.count}</p>
              </div>
            ))}
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

      {/* Répartition par page d'origine (période) */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Répartition par page d'origine ({days}j)</CardTitle>
        </CardHeader>
        <CardContent>
          {bySource.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {bySource.map((s) => {
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                const colorClass =
                  s.source === 'Page produit' ? 'bg-violet-500' :
                  s.source === 'Landing page' ? 'bg-blue-500' :
                  s.source === 'Autre page' ? 'bg-amber-500' : 'bg-gray-400';
                return (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{s.source}</span>
                      <span className="text-gray-500"><span className="font-semibold text-gray-900">{s.count}</span> · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

/* ─────────── FUNNEL TAB ─────────── */
function FunnelTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutCount, setCheckoutCount] = useState(0);
  const [todayCart, setTodayCart] = useState(0);
  const [todayCheckout, setTodayCheckout] = useState(0);
  const [checkoutByDay, setCheckoutByDay] = useState<Array<{ date: string; cart: number; checkout: number }>>([]);
  const [checkoutByBundle, setCheckoutByBundle] = useState<Array<{ label: string; count: number }>>([]);
  const [checkoutValue, setCheckoutValue] = useState(0);
  const [todayCheckoutValue, setTodayCheckoutValue] = useState(0);
  const [withDiscount, setWithDiscount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [uniqueCartVisitors, setUniqueCartVisitors] = useState(0);
  const [uniqueCheckoutVisitors, setUniqueCheckoutVisitors] = useState(0);
  const [trackedCartRows, setTrackedCartRows] = useState(0);
  const [trackedCheckoutRows, setTrackedCheckoutRows] = useState(0);
  const [latencyP50, setLatencyP50] = useState<number | null>(null);
  const [latencyP95, setLatencyP95] = useState<number | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [cartRes, checkoutRes] = await Promise.all([
      supabase.from('cart_events').select('created_at, visitor_id, user_agent, referrer').gte('created_at', since.toISOString()),
      supabase.from('checkout_events').select('*').gte('created_at', since.toISOString()),
    ]);

    if (cartRes.error || checkoutRes.error) {
      console.error('Funnel fetch error:', cartRes.error || checkoutRes.error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Filter out internal preview traffic (Lovable editor/preview) and
    // known bot user-agents so admin counts reflect real visitors only.
    const BOT_UA_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headlesschrome|phantomjs|puppeteer|playwright|lighthouse|pingdom|gtmetrix|uptimerobot|ahrefs|semrush|petalbot/i;
    const isInternalOrBot = (row: { user_agent?: string | null; referrer?: string | null }) => {
      const ref = (row.referrer || '').toLowerCase();
      if (ref.includes('lovable.dev') || ref.includes('lovable.app')) return true;
      const ua = row.user_agent || '';
      if (BOT_UA_RE.test(ua)) return true;
      return false;
    };

    const cartData = (cartRes.data || []).filter((r) => !isInternalOrBot(r));
    // Source of truth = every recorded checkout click. `displayed` is an
    // opportunistic desktop-only signal kept ONLY for latency stats below.
    const checkoutData = (checkoutRes.data || []).filter((r) => !isInternalOrBot(r));

    setCartCount(cartData.length);
    setCheckoutCount(checkoutData.length);

    let tCart = 0;
    let tCheckout = 0;
    let totalValue = 0;
    let todayValue = 0;
    let discountCount = 0;
    const dayCart: Record<string, number> = {};
    const dayCheckout: Record<string, number> = {};
    const bundleMap: Record<string, number> = {};
    const cartVisitorSet = new Set<string>();
    const checkoutVisitorSet = new Set<string>();
    let cartTracked = 0;
    let checkoutTracked = 0;

    cartData.forEach((row: { created_at: string; visitor_id: string | null }) => {
      const d = new Date(row.created_at);
      const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dayCart[day] = (dayCart[day] || 0) + 1;
      if (d >= startOfToday) tCart += 1;
      if (row.visitor_id) {
        cartVisitorSet.add(row.visitor_id);
        cartTracked += 1;
      }
    });

    checkoutData.forEach((row: {
      created_at: string;
      total_price: number | null;
      bundle_labels: string[] | null;
      discount_code: string | null;
      visitor_id?: string | null;
    }) => {
      const d = new Date(row.created_at);
      const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      dayCheckout[day] = (dayCheckout[day] || 0) + 1;
      const price = Number(row.total_price || 0);
      totalValue += price;
      if (d >= startOfToday) {
        tCheckout += 1;
        todayValue += price;
      }
      if (row.discount_code) discountCount += 1;
      (row.bundle_labels || []).forEach((label) => {
        bundleMap[label] = (bundleMap[label] || 0) + 1;
      });
      if (row.visitor_id) {
        checkoutVisitorSet.add(row.visitor_id);
        checkoutTracked += 1;
      }
    });

    // Compute display latency percentiles across rows that captured a value
    // (desktop / opportunistic). It's normal for this to be a subset.
    const latencies = checkoutData
      .map((r: { display_latency_ms?: number | null }) => r.display_latency_ms)
      .filter((v): v is number => typeof v === 'number' && v >= 0)
      .sort((a, b) => a - b);
    if (latencies.length > 0) {
      const pick = (p: number) => latencies[Math.min(latencies.length - 1, Math.floor(p * latencies.length))];
      setLatencyP50(pick(0.5));
      setLatencyP95(pick(0.95));
    } else {
      setLatencyP50(null);
      setLatencyP95(null);
    }

    setTodayCart(tCart);
    setTodayCheckout(tCheckout);
    setCheckoutValue(Math.round(totalValue * 100) / 100);
    setTodayCheckoutValue(Math.round(todayValue * 100) / 100);
    setWithDiscount(discountCount);
    setUniqueCartVisitors(cartVisitorSet.size);
    setUniqueCheckoutVisitors(checkoutVisitorSet.size);
    setTrackedCartRows(cartTracked);
    setTrackedCheckoutRows(checkoutTracked);

    const allDays = Array.from(new Set([...Object.keys(dayCart), ...Object.keys(dayCheckout)])).sort();
    setCheckoutByDay(allDays.map(date => ({
      date,
      cart: dayCart[date] || 0,
      checkout: dayCheckout[date] || 0,
    })));

    setCheckoutByBundle(
      Object.entries(bundleMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    );

    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Chargement du funnel…</span>
      </div>
    );
  }

  const conversionRate = cartCount > 0 ? Math.round((checkoutCount / cartCount) * 1000) / 10 : 0;
  const todayConversionRate = todayCart > 0 ? Math.round((todayCheckout / todayCart) * 1000) / 10 : 0;
  const abandonRate = cartCount > 0 ? Math.round(((cartCount - checkoutCount) / cartCount) * 1000) / 10 : 0;
  const aov = checkoutCount > 0 ? Math.round((checkoutValue / checkoutCount) * 100) / 100 : 0;
  const uniqueConversionRate = uniqueCartVisitors > 0
    ? Math.round((uniqueCheckoutVisitors / uniqueCartVisitors) * 1000) / 10
    : 0;
  const uniqueAbandonRate = uniqueCartVisitors > 0
    ? Math.round(((uniqueCartVisitors - uniqueCheckoutVisitors) / uniqueCartVisitors) * 1000) / 10
    : 0;
  const trackingCoverage = cartCount > 0
    ? Math.round((trackedCartRows / cartCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          {lastUpdate ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR')}` : '—'}
        </p>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
        </button>
      </div>

      {/* Today highlight */}
      <Card className="bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-violet-100 mb-3">
            <Calendar className="h-3.5 w-3.5" />
            Aujourd'hui ({new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-200">Ajouts panier</p>
              <p className="text-3xl font-bold">{todayCart}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-200">Checkouts initiés</p>
              <p className="text-3xl font-bold">{todayCheckout}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-200">Conversion</p>
              <p className="text-3xl font-bold">{todayConversionRate}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-violet-200">Valeur totale</p>
              <p className="text-3xl font-bold">${todayCheckoutValue}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funnel visual */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Entonnoir de conversion ({days}j)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelStep label="🛒 Ajouts au panier" value={cartCount} maxValue={cartCount} color="bg-blue-500" />
            <FunnelStep
              label="💳 Checkouts initiés"
              value={checkoutCount}
              maxValue={cartCount}
              color="bg-violet-500"
              sublabel={`${conversionRate}% des ajouts panier`}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Taux de conversion</p>
              <p className="text-2xl font-bold text-violet-600">{conversionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center gap-1">Abandon panier</p>
              <p className="text-2xl font-bold text-red-500">{abandonRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Panier moyen</p>
              <p className="text-2xl font-bold text-green-600">${aov}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avec code promo</p>
              <p className="text-2xl font-bold text-amber-600">{withDiscount}</p>
            </div>
          </div>
          {/* Display latency block */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Latence affichage (p50) <span className="text-gray-400">— desktop</span></p>
              <p className="text-2xl font-bold text-violet-600">
                {latencyP50 !== null ? `${(latencyP50 / 1000).toFixed(1)}s` : <span className="text-sm text-gray-400 font-normal">Données insuffisantes</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Latence affichage (p95) <span className="text-gray-400">— desktop</span></p>
              <p className={`text-2xl font-bold ${latencyP95 !== null && latencyP95 > 5000 ? 'text-red-500' : 'text-violet-600'}`}>
                {latencyP95 !== null ? `${(latencyP95 / 1000).toFixed(1)}s` : <span className="text-sm text-gray-400 font-normal">Données insuffisantes</span>}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            La latence d'affichage est mesurée en best-effort uniquement quand le navigateur signale le passage à l'onglet Shopify
            (essentiellement desktop). Le nombre de checkouts ci-dessus reflète bien 100% des clics enregistrés.
          </p>
        </CardContent>
      </Card>

      {/* Funnel par visiteur unique */}
      <Card className="bg-white border-2 border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">👤 Entonnoir par visiteur unique ({days}j)</CardTitle>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
              Nouveau
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Déduplique les events : un visiteur qui ajoute 5 fois au panier ne compte qu'une fois.
            C'est le vrai taux de conversion à optimiser.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelStep
              label="👥 Visiteurs ayant ajouté au panier"
              value={uniqueCartVisitors}
              maxValue={uniqueCartVisitors}
              color="bg-blue-500"
            />
            <FunnelStep
              label="💳 Visiteurs ayant vu le checkout"
              value={uniqueCheckoutVisitors}
              maxValue={uniqueCartVisitors}
              color="bg-emerald-500"
              sublabel={`${uniqueConversionRate}% des visiteurs`}
            />
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500">Conversion (uniques)</p>
              <p className="text-2xl font-bold text-emerald-600">{uniqueConversionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Abandon (uniques)</p>
              <p className="text-2xl font-bold text-red-500">{uniqueAbandonRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Visiteurs perdus</p>
              <p className="text-2xl font-bold text-gray-700">
                {Math.max(uniqueCartVisitors - uniqueCheckoutVisitors, 0)}
              </p>
            </div>
          </div>
          {trackingCoverage < 100 && cartCount > 0 && (
            <p className="mt-4 text-[11px] text-gray-400">
              Couverture tracking : {trackingCoverage}% des events ont un visitor_id
              ({trackedCartRows}/{cartCount} panier · {trackedCheckoutRows}/{checkoutCount} checkout).
              Les events plus anciens n'en ont pas — la précision augmentera avec le temps.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Daily comparison chart */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Ajouts vs Checkouts initiés par jour</CardTitle>
        </CardHeader>
        <CardContent>
          {checkoutByDay.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkoutByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="cart" fill="#3b82f6" name="Ajouts panier" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="checkout" fill="#8b5cf6" name="Checkouts initiés" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bundle distribution at checkout */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">Packs présents au moment du checkout</CardTitle>
        </CardHeader>
        <CardContent>
          {checkoutByBundle.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucun checkout enregistré</p>
          ) : (
            <div className="space-y-2">
              {checkoutByBundle.map((b) => (
                <div key={b.label} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                  <span className="text-gray-600">{b.label}</span>
                  <span className="font-semibold">{b.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">💡 Note :</p>
        <p>Le tracking des checkouts vient d'être activé. Les données s'accumuleront à partir de maintenant. Pour le taux de conversion final (checkout → commande payée), il faudra croiser avec les commandes Shopify une fois le token Admin API renouvelé.</p>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, maxValue, color, sublabel }: { label: string; value: number; maxValue: number; color: string; sublabel?: string }) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          <span className="font-semibold text-gray-900">{value}</span>
          {sublabel && <span className="ml-2 text-xs">· {sublabel}</span>}
        </span>
      </div>
      <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all flex items-center justify-end pr-2`} style={{ width: `${Math.max(pct, 2)}%` }}>
          {pct >= 15 && <span className="text-[10px] text-white font-semibold">{pct}%</span>}
        </div>
      </div>
    </div>
  );
}

/* ─────────── SALES TAB (Shopify Admin API) ─────────── */
interface ShopifySummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  paidOrders: number;
  refundedOrders: number;
  cancelledOrders: number;
  newCustomers: number;
  currency: string;
  realRevenue: number;
  realAOV: number;
  abandonedCount: number;
  abandonedValue: number;
  abandonedWithEmail: number;
  abandonedScopeMissing: boolean;
}
interface AbandonedRow {
  id: number;
  email: string | null;
  total_price: string;
  currency: string;
  created_at: string;
  abandoned_checkout_url: string;
  line_items_count: number;
}
interface ShopifyResult {
  summary: ShopifySummary;
  ordersByDay: Record<string, { orders: number; revenue: number }>;
  topProducts: Array<{ title: string; quantity: number; revenue: number }>;
  topCountries: Array<{ code: string; count: number }>;
  abandonedCheckouts: AbandonedRow[];
  attributedOrders?: AttributedOrder[];
}
interface ShopifyAnalyticsError {
  code?: string;
  error?: string;
  action?: string;
  details?: string;
}

function formatShopifyAnalyticsError(payload: ShopifyAnalyticsError, fallbackStatus?: number) {
  const base = payload.error || (fallbackStatus ? `HTTP ${fallbackStatus}` : 'Erreur Shopify inconnue');
  return [base, payload.action, payload.details].filter(Boolean).join(' ');
}

function SalesTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ShopifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  // Set of visitor_ids that DID log a checkout_event on our site.
  // Used to flag Shopify orders whose checkout was untracked client-side
  // (root cause of funnel under-counting).
  const [trackedVisitorIds, setTrackedVisitorIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-analytics?days=${days}`;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const sinceISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const [res, checkoutVisitorsRes] = await Promise.all([
        fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }),
        supabase
          .from('checkout_events')
          .select('visitor_id')
          .gte('created_at', sinceISO)
          .not('visitor_id', 'is', null),
      ]);
      const json = await res.json().catch(() => ({} as ShopifyAnalyticsError));
      if (!res.ok) {
        setError(formatShopifyAnalyticsError(json, res.status));
      } else if (!json || !(json as Partial<ShopifyResult>).summary) {
        setError(formatShopifyAnalyticsError(json as ShopifyAnalyticsError));
      } else {
        setData(json as ShopifyResult);
      }
      const ids = new Set<string>();
      (checkoutVisitorsRes.data || []).forEach((row: { visitor_id: string | null }) => {
        if (row.visitor_id) ids.add(row.visitor_id);
      });
      setTrackedVisitorIds(ids);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    }

    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Chargement des ventes Shopify…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-2 border-red-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Impossible de charger les ventes Shopify</h3>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              {error.includes('401') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                  <p className="font-semibold mb-1">🔑 Token Shopify invalide ou expiré</p>
                  <p className="text-xs mb-2">
                    Le token <code className="bg-amber-100 px-1 rounded">SHOPIFY_ACCESS_TOKEN</code> doit être régénéré
                    dans Shopify Admin → Apps → Custom apps → ton app → API credentials → Reveal token once.
                  </p>
                  <p className="text-xs">
                    Scopes requis : <code className="bg-amber-100 px-1 rounded">read_orders</code>,{' '}
                    <code className="bg-amber-100 px-1 rounded">read_checkouts</code>,{' '}
                    <code className="bg-amber-100 px-1 rounded">read_customers</code>
                  </p>
                </div>
              )}
              <button
                onClick={() => fetchData(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Réessayer
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const s = data.summary;
  const currencySymbol = s.currency === 'USD' ? '$' : s.currency === 'EUR' ? '€' : s.currency;
  // Conversion finale : commandes payées / checkouts initiés (basé sur Shopify uniquement)
  // Note : on ne croise pas avec checkout_events ici car ce sont des univers de tracking différents
  const checkoutToOrderRate = s.abandonedCount + s.paidOrders > 0
    ? Math.round((s.paidOrders / (s.abandonedCount + s.paidOrders)) * 1000) / 10
    : 0;

  // Dernières commandes (depuis attributedOrders, déjà retourné par l'edge fn)
  const recentOrders = [...(data.attributedOrders || [])]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 15);

  // Couverture tracking : combien de ventes Shopify ont un checkout_event correspondant
  const ordersWithVisitor = (data.attributedOrders || []).filter((o) => !!o.visitor_id);
  const trackedOrders = ordersWithVisitor.filter((o) => o.visitor_id && trackedVisitorIds.has(o.visitor_id));
  const totalAttributable = data.attributedOrders?.length ?? 0;
  const coveragePct = totalAttributable > 0
    ? Math.round((trackedOrders.length / totalAttributable) * 100)
    : 0;
  const coverageOk = coveragePct >= 90;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">
          {lastUpdate ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR')}` : '—'}
          <span className="ml-2 text-emerald-600">● Données Shopify Admin API</span>
        </p>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-emerald-700 transition disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
        </button>
      </div>

      {/* Hero card : Revenus réels */}
      <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md border-0">
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-100 mb-3">
            <DollarSign className="h-3.5 w-3.5" />
            Revenus réels — {days} derniers jours (commandes payées uniquement)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200">CA réel</p>
              <p className="text-3xl font-bold">{currencySymbol}{s.realRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200">Commandes payées</p>
              <p className="text-3xl font-bold">{s.paidOrders}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200">Panier moyen réel</p>
              <p className="text-3xl font-bold">{currencySymbol}{s.realAOV.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-200">Nouveaux clients</p>
              <p className="text-3xl font-bold">{s.newCustomers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats secondaires */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-white border">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Total commandes</p>
            <p className="text-2xl font-bold text-gray-900">{s.totalOrders}</p>
            <p className="text-[10px] text-gray-400 mt-1">payées + en attente + remboursées</p>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Remboursées</p>
            <p className="text-2xl font-bold text-orange-600">{s.refundedOrders}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Annulées</p>
            <p className="text-2xl font-bold text-red-600">{s.cancelledOrders}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Conversion finale</p>
            <p className="text-2xl font-bold text-violet-600">{checkoutToOrderRate}%</p>
            <p className="text-[10px] text-gray-400 mt-1">payées / (payées + abandonnées)</p>
          </CardContent>
        </Card>
      </div>

      {/* Dernières commandes Shopify + couverture tracking */}
      <Card className="bg-white border-2 border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                🧾 Dernières commandes ({days}j)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Les {Math.min(15, recentOrders.length)} commandes les plus récentes remontées par Shopify Admin API.
              </p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${coverageOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                {coveragePct}%
              </p>
              <p className="text-xs text-gray-500">
                {trackedOrders.length}/{totalAttributable} trackées
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!coverageOk && totalAttributable > 0 && (
            <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <p className="font-semibold mb-0.5">⚠️ Tracking sous-évalué</p>
              <p>
                Seulement {trackedOrders.length}/{totalAttributable} ventes ont un{' '}
                <code className="bg-amber-100 px-1 rounded">checkout_event</code> côté site. Les onglets
                Funnel / Funnel Checkout affichent donc des chiffres en-dessous de la réalité. Les commandes marquées
                ⚠️ ci-dessous n'ont pas été trackées au moment du clic checkout (souvent : navigation immédiate vers
                Shopify qui tue la requête en vol — déjà corrigé pour les futures ventes).
              </p>
            </div>
          )}
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune commande sur la période</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2 pr-2">Date</th>
                    <th className="text-left py-2 pr-2">N°</th>
                    <th className="text-left py-2 pr-2">Email</th>
                    <th className="text-right py-2 pr-2">Total</th>
                    <th className="text-left py-2 pr-2">Statut</th>
                    <th className="text-left py-2 pr-2">Source</th>
                    <th className="text-center py-2">Tracké</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const tracked = !!(o.visitor_id && trackedVisitorIds.has(o.visitor_id));
                    const source = o.utm_source || (o.fbclid ? 'facebook' : 'direct');
                    return (
                      <tr key={o.id} className="border-t border-gray-100">
                        <td className="py-2 pr-2 text-gray-600 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString('fr-CA', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 pr-2">
                          <a
                            href={`https://admin.shopify.com/store/sleepenzy/orders/${o.id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >{o.name}</a>
                        </td>
                        <td className="py-2 pr-2 text-gray-700 truncate max-w-[180px]" title={o.email || ''}>
                          {o.email || <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="py-2 pr-2 text-right font-semibold whitespace-nowrap">
                          {parseFloat(o.total_price).toFixed(2)} {o.currency}
                        </td>
                        <td className="py-2 pr-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                            o.financial_status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                            : o.financial_status === 'refunded' ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>{o.financial_status || '—'}</span>
                        </td>
                        <td className="py-2 pr-2 text-gray-700">{source}</td>
                        <td className="py-2 text-center">
                          {tracked ? (
                            <span title="Checkout tracké côté site" className="text-emerald-600">✅</span>
                          ) : o.visitor_id ? (
                            <span title="Aucun checkout_event pour ce visitor_id" className="text-amber-600">⚠️</span>
                          ) : (
                            <span title="Pas de visitor_id (commande externe ou ancien tracking)" className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abandoned checkouts */}
      <Card className="bg-white border-2 border-amber-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                ⚠️ Checkouts abandonnés ({days}j)
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Visiteurs arrivés sur la page Shopify mais qui n'ont pas payé. C'est ici que tu perds le plus.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-amber-600">{s.abandonedCount}</p>
              <p className="text-xs text-gray-500">CA perdu : {currencySymbol}{s.abandonedValue.toFixed(2)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {s.abandonedScopeMissing ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
              <p className="font-semibold mb-1">🔒 Scope manquant</p>
              <p className="text-xs">
                Le token Shopify n'a pas la permission <code className="bg-amber-100 px-1 rounded">read_checkouts</code>.
                Va dans Shopify Admin → Apps → ta Custom App → Configuration → coche cette permission, puis régénère le token.
              </p>
            </div>
          ) : data.abandonedCheckouts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucun checkout abandonné sur la période 🎉</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-700">Avec email récupéré</p>
                  <p className="text-2xl font-bold text-amber-900">{s.abandonedWithEmail}</p>
                  <p className="text-[10px] text-amber-600 mt-1">→ relançables par email automatique</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Sans email</p>
                  <p className="text-2xl font-bold text-gray-700">{s.abandonedCount - s.abandonedWithEmail}</p>
                  <p className="text-[10px] text-gray-500 mt-1">→ perdus définitivement</p>
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-700 mb-2">25 plus récents :</p>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {data.abandonedCheckouts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs border-b border-gray-50 py-2 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {c.email || <span className="text-gray-400 italic">Pas d'email</span>}
                      </p>
                      <p className="text-gray-500 text-[10px]">
                        {new Date(c.created_at).toLocaleString('fr-FR')} · {c.line_items_count} article{c.line_items_count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="font-semibold text-amber-700 whitespace-nowrap">
                      {currencySymbol}{parseFloat(c.total_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top products */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">🏆 Top produits vendus ({days}j)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune vente</p>
          ) : (
            <div className="space-y-2">
              {data.topProducts.map((p, i) => (
                <div key={p.title} className="flex items-center justify-between text-sm border-b border-gray-50 py-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-400 text-xs w-5">#{i + 1}</span>
                    <span className="text-gray-700 truncate">{p.title}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{currencySymbol}{p.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">{p.quantity} unité{p.quantity > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top countries */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">🌍 Pays</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topCountries.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {data.topCountries.map((c) => (
                <div key={c.code} className="flex justify-between text-sm border-b border-gray-50 py-1">
                  <span className="text-gray-600">{c.code}</span>
                  <span className="font-semibold">{c.count} commande{c.count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">💡 Comment lire ces chiffres :</p>
        <ul className="text-xs space-y-1 list-disc pl-5">
          <li><strong>Revenus réels</strong> = uniquement les commandes payées. C'est ton vrai CA.</li>
          <li><strong>Conversion finale</strong> = parmi tous ceux qui ont commencé un checkout Shopify, % qui ont payé. Si bas (&lt;30%), problème de friction au paiement (frais port, méthode CB, confiance).</li>
          <li><strong>Avec email récupéré</strong> = Shopify peut envoyer des emails de relance automatiques (à activer dans Shopify Admin → Marketing → Automations).</li>
        </ul>
      </div>
    </div>
  );
}

/* ─────────── FRICTIONS TAB — drop-offs & frustration signals ─────────── */

const FUNNEL_STEPS_ORDER = [
  { key: 'session_landing', label: 'Arrivée site' },
  { key: 'view_product', label: 'Vue produit' },
  { key: 'select_color', label: 'Choix couleur' },
  { key: 'select_bundle', label: 'Choix pack' },
  { key: 'add_to_cart', label: 'Ajout panier' },
  { key: 'open_cart', label: 'Ouverture panier' },
  { key: 'click_checkout', label: 'Clic checkout' },
  { key: 'return_from_checkout', label: 'Retour (abandon)' },
] as const;

const FRICTION_LABELS: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  rage_click: { label: 'Rage click', icon: MousePointerClick, color: 'bg-red-100 text-red-700 border-red-200' },
  dead_click: { label: 'Dead click', icon: MousePointerClick, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  js_error: { label: 'Erreur JavaScript', icon: Bug, color: 'bg-red-100 text-red-700 border-red-200' },
  shopify_error: { label: 'Erreur Shopify', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
  product_load_error: { label: 'Échec chargement produit', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
  checkout_error: { label: 'Erreur checkout', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
  slow_response: { label: 'Lenteur API', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  hesitation_abandon: { label: 'Hésitation', icon: TrendingDown, color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

function FrictionsTab({ days }: { days: number }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [funnelCounts, setFunnelCounts] = useState<Record<string, number>>({});
  const [frictionCounts, setFrictionCounts] = useState<Array<{ type: string; count: number }>>([]);
  const [topElements, setTopElements] = useState<Array<{ element: string; type: string; count: number }>>([]);
  const [recentErrors, setRecentErrors] = useState<Array<{ id: string; type: string; message: string | null; element: string | null; page_path: string | null; device: string | null; created_at: string }>>([]);
  const [byDevice, setByDevice] = useState<Record<string, Record<string, number>>>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [funnelRes, frictionRes] = await Promise.all([
      supabase.from('funnel_events').select('step, visitor_id, created_at').gte('created_at', since.toISOString()),
      supabase.from('friction_events').select('id, type, severity, message, element, page_path, device, created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false }),
    ]);

    if (funnelRes.error || frictionRes.error) {
      console.error('Frictions fetch error:', funnelRes.error || frictionRes.error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    /* ── Funnel: unique visitors per step ── */
    const stepVisitors: Record<string, Set<string>> = {};
    (funnelRes.data || []).forEach((row: { step: string; visitor_id: string | null }) => {
      if (!stepVisitors[row.step]) stepVisitors[row.step] = new Set();
      if (row.visitor_id) stepVisitors[row.step].add(row.visitor_id);
    });
    const counts: Record<string, number> = {};
    FUNNEL_STEPS_ORDER.forEach(s => { counts[s.key] = stepVisitors[s.key]?.size || 0; });
    setFunnelCounts(counts);

    /* ── Friction: aggregate ── */
    const typeMap: Record<string, number> = {};
    const elementMap: Record<string, { type: string; count: number }> = {};
    const deviceMap: Record<string, Record<string, number>> = {};

    (frictionRes.data || []).forEach((row: { type: string; element: string | null; device: string | null }) => {
      typeMap[row.type] = (typeMap[row.type] || 0) + 1;
      if (row.element) {
        const key = `${row.type}::${row.element}`;
        elementMap[key] = { type: row.type, count: (elementMap[key]?.count || 0) + 1 };
      }
      if (row.device) {
        if (!deviceMap[row.device]) deviceMap[row.device] = {};
        deviceMap[row.device][row.type] = (deviceMap[row.device][row.type] || 0) + 1;
      }
    });

    setFrictionCounts(
      Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    );
    setTopElements(
      Object.entries(elementMap)
        .map(([key, v]) => ({ element: key.split('::')[1], type: v.type, count: v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)
    );
    setRecentErrors((frictionRes.data || []).slice(0, 30) as never);
    setByDevice(deviceMap);
    setLastUpdate(new Date());
    setLoading(false);
    setRefreshing(false);
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const i = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(i);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-3 text-gray-500">Analyse des frictions…</span>
      </div>
    );
  }

  /* ── Compute drop-offs from funnel ── */
  const orderedCounts = FUNNEL_STEPS_ORDER.map(s => ({ ...s, count: funnelCounts[s.key] || 0 }));
  const maxCount = Math.max(1, ...orderedCounts.map(s => s.count));
  // Find biggest leak (largest absolute drop between consecutive steps)
  let biggestLeak: { from: string; to: string; loss: number; rate: number } | null = null;
  for (let i = 0; i < orderedCounts.length - 1; i++) {
    const a = orderedCounts[i], b = orderedCounts[i + 1];
    if (a.count > 0) {
      const loss = a.count - b.count;
      const rate = (loss / a.count) * 100;
      if (!biggestLeak || loss > biggestLeak.loss) {
        biggestLeak = { from: a.label, to: b.label, loss, rate };
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-500">{lastUpdate ? `Mis à jour à ${lastUpdate.toLocaleTimeString('fr-FR')}` : '—'}</p>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-red-700 transition disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Rafraîchissement…' : 'Rafraîchir'}
        </button>
      </div>

      {/* Biggest leak hero */}
      {biggestLeak && biggestLeak.loss > 0 && (
        <Card className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 text-xs text-red-100 mb-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Plus grosse fuite du funnel
                </div>
                <p className="text-xl font-bold">{biggestLeak.from} → {biggestLeak.to}</p>
                <p className="text-sm text-red-100 mt-1">
                  {biggestLeak.loss} visiteur{biggestLeak.loss > 1 ? 's' : ''} perdu{biggestLeak.loss > 1 ? 's' : ''} ({biggestLeak.rate.toFixed(0)}% d'abandon)
                </p>
              </div>
              <div className="text-xs text-red-50 max-w-sm">
                💡 Cette étape concentre la plus grosse perte. Regarde les replays Clarity filtrés sur l'event <code className="bg-white/20 px-1 py-0.5 rounded">funnel_{FUNNEL_STEPS_ORDER.find(s => s.label === biggestLeak!.from)?.key}</code> pour comprendre pourquoi.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Funnel visualization */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">🎯 Funnel d'achat — visiteurs uniques par étape</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Sur les {days} derniers jours. Chaque visiteur est compté une fois par étape.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {orderedCounts.map((s, i) => {
              const prev = i > 0 ? orderedCounts[i - 1].count : 0;
              const dropRate = i > 0 && prev > 0 ? ((prev - s.count) / prev) * 100 : 0;
              const widthPct = (s.count / maxCount) * 100;
              const isLeak = i > 0 && dropRate > 50;
              return (
                <div key={s.key} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{i + 1}. {s.label}</span>
                    <span className="font-semibold text-gray-900">
                      {s.count}
                      {i > 0 && (
                        <span className={`ml-2 text-[10px] ${isLeak ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                          {dropRate > 0 ? `−${dropRate.toFixed(0)}%` : '—'}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-7 bg-gray-100 rounded overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${isLeak ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.max(2, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Friction summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(FRICTION_LABELS).map(([type, meta]) => {
          const count = frictionCounts.find(f => f.type === type)?.count || 0;
          const Icon = meta.icon;
          return (
            <Card key={type} className={`border ${count > 0 ? meta.color : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 text-[11px] mb-1">
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top elements causing friction */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Éléments qui frustrent le plus
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">Tries par fréquence. Ce sont tes priorités pour fixer le parcours.</p>
        </CardHeader>
        <CardContent>
          {topElements.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Aucun élément problématique détecté 🎉</p>
          ) : (
            <div className="space-y-2">
              {topElements.map((el, i) => {
                const meta = FRICTION_LABELS[el.type];
                return (
                  <div key={i} className="flex items-center justify-between gap-3 p-2 rounded border border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta?.color || 'bg-gray-100'}`}>
                        {meta?.label || el.type}
                      </span>
                      <code className="text-xs text-gray-700 truncate">{el.element}</code>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">{el.count}×</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Frictions by device */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">📱 Frictions par appareil</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(byDevice).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Aucune donnée</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['mobile', 'tablet', 'desktop'] as const).map(dev => (
                <div key={dev} className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">{dev}</p>
                  <p className="text-2xl font-bold mb-2">
                    {Object.values(byDevice[dev] || {}).reduce((a, b) => a + b, 0)}
                  </p>
                  <div className="space-y-1">
                    {Object.entries(byDevice[dev] || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([type, c]) => (
                        <div key={type} className="flex justify-between text-[11px] border-b border-gray-50 pb-0.5">
                          <span className="text-gray-600 truncate">{FRICTION_LABELS[type]?.label || type}</span>
                          <span className="font-semibold text-gray-900">{c}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent errors timeline */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-base">🕒 30 dernières frictions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Aucune friction enregistrée</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {recentErrors.map((e) => {
                const meta = FRICTION_LABELS[e.type];
                return (
                  <div key={e.id} className="flex items-start gap-2 p-2 rounded border border-gray-100 text-xs">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${meta?.color || 'bg-gray-100'}`}>
                      {meta?.label || e.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      {e.message && <p className="text-gray-800 truncate">{e.message}</p>}
                      {e.element && <code className="text-[10px] text-gray-500 block truncate">{e.element}</code>}
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {e.page_path} · {e.device} · {new Date(e.created_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">💡 Comment utiliser cette page :</p>
        <ul className="text-xs space-y-1 list-disc pl-5">
          <li><strong>Plus grosse fuite</strong> → la priorité numéro 1. Va voir les replays Clarity sur ce moment précis.</li>
          <li><strong>Rage clicks / Dead clicks</strong> → un élément a l'air cliquable mais ne l'est pas, ou est cassé. Fixe-le.</li>
          <li><strong>Erreurs Shopify / JS</strong> → bugs techniques. Chaque erreur peut faire perdre une vente.</li>
          <li><strong>Lenteur API</strong> → si &gt; 3s, le visiteur quitte. Optimise ou cache.</li>
          <li><strong>Frictions par appareil</strong> → si mobile concentre les frictions, ton UX mobile a un problème.</li>
        </ul>
      </div>
    </div>
  );
}
