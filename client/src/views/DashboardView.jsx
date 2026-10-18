import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building, 
  Wallet, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Truck, 
  Package, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  ChevronRight,
  Coins,
  LayoutDashboard,
  MapPin,
  CalendarDays,
  Target,
  Gauge,
  HardHat,
  Wrench,
  BarChart3,
  ChevronDown,
  X,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate, getStatusBadge } from '../utils/formatters';

const CATEGORY_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#4b5563', '#be185d', '#65a30d', '#0369a1'];
const STATUT_COLORS = { RESERVE: '#f59e0b', SOUS_COMPROMIS: '#3b82f6', ACTE_NOTARIE: '#8b5cf6', LIVRE: '#10b981' };

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono font-semibold">
          {p.name}: {formatDA(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Budget Gauge Component ──────────────────────────────────────────────────
function BudgetGauge({ budget, consumed, label }) {
  const pct = budget ? Math.min(100, Math.round((consumed / budget) * 100)) : 0;
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle 
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold" style={{ color }}>{pct}%</span>
          <span className="text-[10px] text-slate-500 font-semibold">Consommé</span>
        </div>
      </div>
      <p className="text-xs text-slate-600 font-semibold mt-2">{label || 'Budget'}</p>
      <p className="text-[11px] text-slate-400 font-mono">{formatDACompact(consumed)} / {formatDACompact(budget)}</p>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, label, value, sub, onClick, trend }) {
  return (
    <div 
      className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? <ArrowUpRight className="inline w-3 h-3" /> : <ArrowDownRight className="inline w-3 h-3" />}
            {trend.text}
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD VIEW
// ═════════════════════════════════════════════════════════════════════════════
export default function DashboardView({ onSelectChantier, onOpenPrintBon, onNavigate, chantiers: chantiersList }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChantierId, setSelectedChantierId] = useState(null);
  const [showChantierDropdown, setShowChantierDropdown] = useState(false);
  const [availableChantiers, setAvailableChantiers] = useState([]);

  // Load the list of chantiers for the selector
  useEffect(() => {
    async function loadChantiers() {
      try {
        if (chantiersList?.length) {
          setAvailableChantiers(chantiersList);
        } else {
          const list = await api.getChantiers();
          setAvailableChantiers(list);
        }
      } catch (e) {
        console.error('Error loading chantiers list:', e);
      }
    }
    loadChantiers();
  }, [chantiersList]);

  // Load stats based on selection
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      let stats;
      if (selectedChantierId) {
        stats = await api.getDashboardChantierStats(selectedChantierId);
      } else {
        stats = await api.getDashboardStats();
      }
      setData(stats);
    } catch (e) {
      console.error('Error loading dashboard stats:', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedChantierId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSelectChantier = (chantierId) => {
    setSelectedChantierId(chantierId);
    setShowChantierDropdown(false);
  };

  const handleResetToGlobal = () => {
    setSelectedChantierId(null);
    setShowChantierDropdown(false);
  };

  const selectedChantierInfo = availableChantiers.find(c => c.id === selectedChantierId);

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">
            Chargement des données {selectedChantierId ? 'du chantier' : 'globales'}...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Impossible de charger les données du tableau de bord.
        <button onClick={loadStats} className="ml-2 text-blue-600 hover:text-blue-700 font-semibold">
          Réessayer
        </button>
      </div>
    );
  }

  // ─── Render: Per-Chantier Dashboard ────────────────────────────────────────
  if (selectedChantierId && data.chantier) {
    return renderChantierDashboard(data);
  }

  // ─── Render: Global Dashboard ──────────────────────────────────────────────
  return renderGlobalDashboard(data);

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  function renderGlobalDashboard(data) {
    const { chantiersSummary, tresorerie, depenses, ventes, personnel, materiel, stocksAlertes, chantiersProgress, recentMouvements } = data;

    return (
      <div className="space-y-6">
        {/* Header with Chantier Selector */}
        {renderHeader('Tableau de Bord Stratégique — Vue Globale', 'Supervision multi-chantiers, fonds de roulement & gestion opérationnelle')}

        {/* Critical Alerts Banner */}
        {(tresorerie.alertesCount > 0 || stocksAlertes?.length > 0) && (
          <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Alertes Immédiates Nécessitant Attention</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {tresorerie.caissesAlertes?.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-amber-200">
                  <div>
                    <span className="font-bold text-slate-800">{c.name}</span>
                    <p className="text-[11px] text-rose-600 font-semibold">Solde Caisse Faible: {formatDA(c.balance)} (Seuil: {formatDA(c.seuil_alerte)})</p>
                  </div>
                  <button
                    onClick={() => onNavigate('caisses')}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-[11px] transition"
                  >
                    Alimenter FDR
                  </button>
                </div>
              ))}
              {stocksAlertes?.map((stk) => (
                <div key={stk.id} className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-amber-200">
                  <div>
                    <span className="font-bold text-slate-800">{stk.designation}</span>
                    <p className="text-[11px] text-amber-700 font-medium">Stock Critique: <strong className="text-rose-700">{stk.quantite_totale} {stk.unite}</strong> (Seuil: {stk.stock_min_alerte})</p>
                  </div>
                  <button
                    onClick={() => onNavigate('stocks')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-semibold text-[11px] transition"
                  >
                    Commander
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary KPI Grid (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            icon={Wallet} iconBg="bg-emerald-50 text-emerald-600"
            label="Trésorerie Globale" value={formatDA(tresorerie.total)}
            sub={<>FDR Chantiers: <strong className="text-slate-700">{formatDACompact(tresorerie.fdrChantiers)}</strong> — Banques: <strong className="text-slate-700">{formatDACompact(tresorerie.banques)}</strong></>}
          />
          <KpiCard
            icon={Building} iconBg="bg-blue-50 text-blue-600"
            label="Chantiers Actifs" value={`${chantiersSummary.active} / ${chantiersSummary.total}`}
            trend={{ positive: true, text: `${chantiersSummary.avgProgress}% moy.` }}
            sub={<>Budget Total: <strong className="text-slate-700 font-mono">{formatDACompact(chantiersSummary.totalBudget)}</strong></>}
          />
          <KpiCard
            icon={Receipt} iconBg="bg-rose-50 text-rose-600"
            label="Dépenses Cumulées" value={formatDACompact(depenses.total)}
            sub={<>Payé: <strong className="text-emerald-700 font-mono">{formatDACompact(depenses.paye)}</strong> — Reste Dû: <strong className="text-rose-700 font-mono">{formatDACompact(depenses.resteAPayer)}</strong></>}
          />
          <KpiCard
            icon={Users} iconBg="bg-indigo-50 text-indigo-600"
            label="Personnel Chantiers" value={`${personnel.actifs} Actifs`}
            sub={<>Masse Salariale / Mois: <strong className="text-indigo-900 font-mono">{formatDACompact(personnel.masseSalarialeMois)}</strong></>}
          />
          <KpiCard
            icon={TrendingUp} iconBg="bg-amber-50 text-amber-600"
            label="Ventes & Recouvrement" value={`${ventes.tauxRecouvrement}%`}
            sub={<>Encaissé: <strong className="text-emerald-700 font-mono">{formatDACompact(ventes.totalRecouvre)}</strong> sur {ventes.totalContrats} contrats</>}
          />
        </div>

        {/* Charts Row: Evolution Dépenses + Répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Dépenses Mensuelles (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Évolution des Dépenses Mensuelles</h2>
                <p className="text-xs text-slate-500">Dépenses engagées sur les 12 derniers mois (DA)</p>
              </div>
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              {depenses.evolution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={depenses.evolution}>
                    <defs>
                      <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatDACompact(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="montant" name="Dépenses" stroke="#3b82f6" fill="url(#colorDepenses)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">Aucune donnée d'évolution disponible</div>
              )}
            </div>
          </div>

          {/* Répartition Dépenses (1 col) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Répartition des Dépenses</h2>
              <p className="text-xs text-slate-500 mb-4">Postes de dépenses principaux en DA</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={depenses.parCategorie}
                      dataKey="montant" nameKey="categorie"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}
                    >
                      {depenses.parCategorie?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatDA(val)} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {depenses.parCategorie?.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                    <span className="text-slate-600 font-medium truncate max-w-[130px]">{cat.categorie}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatDACompact(cat.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chantiers Progress + Ventes Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avancement par Chantier (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Avancement & Consommation Budgétaire par Chantier</h2>
                <p className="text-xs text-slate-500">Cliquez sur un chantier pour voir son tableau de bord dédié</p>
              </div>
              <button
                onClick={() => onNavigate('chantiers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Tous les chantiers <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {chantiersProgress?.map((ch) => {
                const b = getStatusBadge(ch.status);
                const pctBudget = ch.budget_total ? Math.min(100, Math.round((ch.depenses_cumulees / ch.budget_total) * 100)) : 0;

                return (
                  <div 
                    key={ch.id} 
                    onClick={() => handleSelectChantier(ch.id)}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{ch.code}</span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">{ch.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${b.bg}`}>{b.label}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium text-right flex items-center gap-3">
                        <span>Solde FDR: <strong className="text-emerald-700 font-mono">{formatDA(ch.caisse_solde || 0)}</strong></span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Avancement Travaux</span>
                          <span className="font-bold text-slate-800">{ch.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${ch.progress_percentage}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                          <span>Budget Engagé : {formatDACompact(ch.depenses_cumulees)} / {formatDACompact(ch.budget_total)}</span>
                          <span className="font-bold text-slate-800">{pctBudget}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${pctBudget > 90 ? 'bg-rose-500' : (pctBudget > 70 ? 'bg-amber-500' : 'bg-emerald-500')}`} 
                            style={{ width: `${pctBudget}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ventes par statut (1 col) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Ventes par Statut</h2>
            <p className="text-xs text-slate-500 mb-4">{ventes.totalContrats} contrats — {formatDACompact(ventes.totalVentes)} DA total</p>
            
            {ventes.parStatut?.length > 0 ? (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ventes.parStatut}
                        dataKey="montant" nameKey="statut"
                        cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}
                      >
                        {ventes.parStatut.map((entry, index) => (
                          <Cell key={index} fill={STATUT_COLORS[entry.statut] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatDA(val)} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  {ventes.parStatut.map((s, idx) => {
                    const statusLabels = { RESERVE: 'Réservé', SOUS_COMPROMIS: 'Sous Compromis', ACTE_NOTARIE: 'Acte Notarié', LIVRE: 'Livré' };
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COLORS[s.statut] || CATEGORY_COLORS[idx] }}></div>
                          <span className="text-slate-600 font-medium">{statusLabels[s.statut] || s.statut} ({s.count})</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800">{formatDACompact(s.montant)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Aucune vente enregistrée</div>
            )}
          </div>
        </div>

        {/* Recent Cash Flow */}
        {renderRecentMouvements(recentMouvements)}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PER-CHANTIER DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  function renderChantierDashboard(data) {
    const { chantier, tresorerie, depenses, ventes, personnel, materiel, stocks, recentMouvements, budgetConsommation } = data;
    const b = getStatusBadge(chantier.status);

    return (
      <div className="space-y-6">
        {/* Header with back to global */}
        {renderHeader(
          chantier.name,
          `${chantier.code} — ${chantier.wilaya}, ${chantier.commune}`,
          true
        )}

        {/* Chantier Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Statut</p>
              <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${b.bg}`}>{b.label}</span>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Type Projet</p>
              <p className="font-bold text-slate-800">{chantier.type || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Démarrage</p>
              <p className="font-bold text-slate-800">{formatDate(chantier.start_date)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Fin Prévue</p>
              <p className="font-bold text-slate-800">{formatDate(chantier.end_date_planned)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Surface</p>
              <p className="font-bold text-slate-800">{chantier.surface_totale_m2 ? `${chantier.surface_totale_m2.toLocaleString('fr-DZ')} m²` : '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium mb-0.5">Unités / Lots</p>
              <p className="font-bold text-slate-800">{chantier.nombre_unites || '-'}</p>
            </div>
          </div>
          {chantier.chef_chantier_name && (
            <div className="mt-3 pt-3 border-t border-blue-200/50 text-xs text-blue-800">
              <HardHat className="inline w-3.5 h-3.5 mr-1" />
              Chef de chantier : <strong>{chantier.chef_chantier_name}</strong>
            </div>
          )}
        </div>

        {/* KPIs Row (Budget Gauge + 4 cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Budget Gauge (takes 1 column) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-center">
            <BudgetGauge 
              budget={budgetConsommation?.budget || chantier.budget_total} 
              consumed={budgetConsommation?.depensesCumulees || 0} 
              label="Budget Chantier"
            />
          </div>

          {/* Avancement */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avancement</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-blue-700 font-mono">{chantier.progress_percentage}%</div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-700" style={{ width: `${chantier.progress_percentage}%` }} />
            </div>
          </div>

          {/* Trésorerie Chantier */}
          <KpiCard
            icon={Wallet} iconBg="bg-emerald-50 text-emerald-600"
            label="Trésorerie FDR" value={formatDA(tresorerie?.total || 0)}
            sub={tresorerie?.alertesCount > 0 
              ? <span className="text-rose-600 font-semibold">⚠ {tresorerie.alertesCount} caisse(s) en alerte</span> 
              : <span className="text-emerald-600">✓ Caisses dans les seuils</span>
            }
          />

          {/* Personnel sur chantier */}
          <KpiCard
            icon={Users} iconBg="bg-indigo-50 text-indigo-600"
            label="Personnel Affecté" value={`${personnel?.total || 0}`}
            sub={<>Permanents: <strong>{personnel?.permanents || 0}</strong> — Tâcherons: <strong>{personnel?.journaliers || 0}</strong></>}
          />

          {/* Matériel sur chantier */}
          <KpiCard
            icon={Truck} iconBg="bg-orange-50 text-orange-600"
            label="Matériel Affecté" value={`${materiel?.total || 0}`}
            sub={<>Internes: <strong>{materiel?.internes || 0}</strong> — Loués: <strong>{materiel?.loues || 0}</strong>{materiel?.enPanne > 0 && <> — <span className="text-rose-600">En Panne: {materiel.enPanne}</span></>}</>}
          />
        </div>

        {/* Charts: Dépenses Evolution + Répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolution Dépenses Mensuelles */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Évolution des Dépenses du Chantier</h2>
            <p className="text-xs text-slate-500 mb-4">Dépenses mensuelles en Dinars Algériens</p>
            <div className="h-60 w-full">
              {depenses?.evolution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={depenses.evolution} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => formatDACompact(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="montant" name="Dépenses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">Aucune dépense enregistrée</div>
              )}
            </div>
          </div>

          {/* Répartition Dépenses Chantier */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-1">Répartition des Dépenses</h2>
              <p className="text-xs text-slate-500 mb-4">Total: {formatDACompact(depenses?.total || 0)}</p>
              <div className="h-44 w-full">
                {depenses?.parCategorie?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={depenses.parCategorie} dataKey="montant" nameKey="categorie" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                        {depenses.parCategorie.map((_, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatDA(val)} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">Aucune donnée</div>
                )}
              </div>
            </div>
            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              {depenses?.parCategorie?.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}></div>
                    <span className="text-slate-600 font-medium truncate max-w-[120px]">{cat.categorie}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatDACompact(cat.montant)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ventes du Chantier + Personnel List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Ventes & Recouvrement du Chantier</h2>
            <p className="text-xs text-slate-500 mb-4">{ventes?.totalContrats || 0} contrats de vente enregistrés</p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                <p className="text-[11px] text-emerald-700 font-semibold mb-0.5">Total Ventes</p>
                <p className="text-lg font-extrabold text-emerald-800 font-mono">{formatDACompact(ventes?.totalVentes || 0)}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                <p className="text-[11px] text-blue-700 font-semibold mb-0.5">Taux Recouvrement</p>
                <p className="text-lg font-extrabold text-blue-800 font-mono">{ventes?.tauxRecouvrement || 0}%</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-200">
                <p className="text-[11px] text-indigo-700 font-semibold mb-0.5">Montant Encaissé</p>
                <p className="text-lg font-extrabold text-indigo-800 font-mono">{formatDACompact(ventes?.totalRecouvre || 0)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
                <p className="text-[11px] text-amber-700 font-semibold mb-0.5">Reste à Recouvrer</p>
                <p className="text-lg font-extrabold text-amber-800 font-mono">{formatDACompact(ventes?.resteARecouvrer || 0)}</p>
              </div>
            </div>

            {ventes?.parStatut?.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                {ventes.parStatut.map((s, idx) => {
                  const statusLabels = { RESERVE: 'Réservé', SOUS_COMPROMIS: 'Sous Compromis', ACTE_NOTARIE: 'Acte Notarié', LIVRE: 'Livré' };
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_COLORS[s.statut] || '#6b7280' }}></div>
                        <span className="text-slate-600 font-medium">{statusLabels[s.statut] || s.statut} ({s.count})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatDACompact(s.montant)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Personnel List */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Personnel Affecté au Chantier</h2>
            <p className="text-xs text-slate-500 mb-4">
              {personnel?.total || 0} employé(s) — Masse Salariale: <strong className="text-indigo-700 font-mono">{formatDACompact(personnel?.masseSalarialeMois || 0)}/mois</strong>
            </p>
            
            {personnel?.liste?.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {personnel.liste.map((emp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                        {(emp.prenom?.[0] || '') + (emp.nom?.[0] || '')}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{emp.prenom} {emp.nom}</p>
                        <p className="text-[10px] text-slate-500">{emp.poste}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${emp.type_contrat === 'PERMANENT_MENSUEL' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                      {emp.type_contrat === 'PERMANENT_MENSUEL' ? 'Permanent' : 'Journalier'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">Aucun personnel affecté</div>
            )}
          </div>
        </div>

        {/* Matériel List + Stocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matériel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Matériel & Engins sur Chantier</h2>
            <p className="text-xs text-slate-500 mb-4">
              {materiel?.total || 0} équipement(s) affecté(s)
              {materiel?.coutLocationMois ? <> — Coût Location: <strong className="text-orange-700 font-mono">{formatDACompact(materiel.coutLocationMois)}/mois</strong></> : ''}
            </p>
            
            {materiel?.liste?.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {materiel.liste.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{mat.nom}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{mat.code_parc} — {mat.categorie}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mat.type_propriete === 'INTERNE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {mat.type_propriete === 'INTERNE' ? 'Interne' : 'Location'}
                      </span>
                      {mat.statut === 'EN_PANNE' && <p className="text-[10px] text-rose-600 font-bold mt-0.5">⚠ En Panne</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">Aucun matériel affecté</div>
            )}
          </div>

          {/* Stocks sur chantier */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Stocks Matériaux sur Chantier</h2>
            <p className="text-xs text-slate-500 mb-4">
              Niveaux de stock et alertes pour ce chantier
              {stocks?.alertes?.length > 0 && <span className="text-rose-600 font-semibold ml-1">({stocks.alertes.length} alerte(s))</span>}
            </p>
            
            {stocks?.articles?.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {stocks.articles.map((art, idx) => {
                  const isAlerte = art.quantite <= art.stock_min_alerte;
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg text-xs border ${isAlerte ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div>
                        <p className="font-bold text-slate-800">{art.designation}</p>
                        <p className="text-[10px] text-slate-500">{art.categorie}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${isAlerte ? 'text-rose-700' : 'text-slate-800'}`}>
                          {art.quantite} {art.unite}
                        </p>
                        {isAlerte && <p className="text-[10px] text-rose-500">Min: {art.stock_min_alerte}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-xs">Aucun stock enregistré</div>
            )}
          </div>
        </div>

        {/* Recent Cash Flow for this chantier */}
        {renderRecentMouvements(recentMouvements)}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderHeader(title, subtitle, showBackToGlobal = false) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {showBackToGlobal && (
            <button
              onClick={handleResetToGlobal}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="Retour vue globale"
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Chantier Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowChantierDropdown(!showChantierDropdown)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                selectedChantierId 
                  ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4" />
              {selectedChantierId 
                ? (selectedChantierInfo?.name || 'Chantier sélectionné')
                : 'Vue Globale — Tous les chantiers'
              }
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showChantierDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChantierDropdown(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                  {/* Global option */}
                  <button
                    onClick={handleResetToGlobal}
                    className={`w-full text-left px-4 py-3 text-xs font-semibold border-b border-slate-100 transition ${
                      !selectedChantierId ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <div>
                        <p className="font-bold">Vue Globale</p>
                        <p className="text-[10px] text-slate-500">Tous les chantiers & trésorerie consolidée</p>
                      </div>
                    </div>
                  </button>

                  {/* Per-chantier options */}
                  {availableChantiers.map((ch) => {
                    const sb = getStatusBadge(ch.status);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleSelectChantier(ch.id)}
                        className={`w-full text-left px-4 py-2.5 text-xs transition border-b border-slate-50 last:border-0 ${
                          selectedChantierId === ch.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 mr-1">{ch.code}</span>
                            <span className="font-bold">{ch.name}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sb.bg}`}>{sb.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{ch.wilaya} — Budget: {formatDACompact(ch.budget_total)}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={loadStats}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Real-time badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Temps Réel
          </span>
        </div>
      </div>
    );
  }

  function renderRecentMouvements(mouvements) {
    if (!mouvements?.length) return null;

    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Derniers Mouvements {selectedChantierId ? 'du Chantier' : 'des Caisses de Fond de Roulement'}
            </h2>
            <p className="text-xs text-slate-500">Décaissements, approvisionnements et pièces justificatives récentes</p>
          </div>
          <button
            onClick={() => onNavigate('caisses')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Toutes les caisses & pièces <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200">
                <th className="py-2.5 px-3">Réf. Bon</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Caisse / FDR</th>
                {!selectedChantierId && <th className="py-2.5 px-3">Chantier</th>}
                <th className="py-2.5 px-3">Motif & Bénéficiaire</th>
                <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {mouvements.map((mvt) => {
                const isSortie = mvt.type === 'SORTIE';
                return (
                  <tr key={mvt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{mvt.reference}</td>
                    <td className="py-2.5 px-3 text-slate-500">{formatDate(mvt.date)}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{mvt.caisse_name}</span>
                    </td>
                    {!selectedChantierId && (
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px]">
                          {mvt.chantier_name || 'Siège'}
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 px-3 max-w-[280px] truncate">
                      <div className="font-semibold text-slate-900 truncate">{mvt.motif}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {mvt.beneficiaire_name || mvt.fournisseur_name || mvt.categorie}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                      <span className={isSortie ? 'text-rose-600' : 'text-emerald-600'}>
                        {isSortie ? '-' : '+'}{formatDA(mvt.montant)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenPrintBon(mvt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        title="Imprimer le bon de caisse officiel"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimer</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
