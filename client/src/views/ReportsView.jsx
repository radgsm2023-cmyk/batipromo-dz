import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Building, 
  Wallet, 
  Receipt, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Calendar, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function ReportsView({ companySettings, chantiers = [] }) {
  const [activeTab, setActiveTab] = useState('tresorerie'); // 'tresorerie' | 'grandlivre'
  const [tresorerieData, setTresorerieData] = useState(null);
  const [grandLivreData, setGrandLivreData] = useState(null);
  const [selectedChantierFilter, setSelectedChantierFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tresorerie') {
        const data = await api.getBilanTresorerie();
        setTresorerieData(data);
      } else {
        const data = await api.getGrandLivreDepenses({ 
          chantier_id: selectedChantierFilter || undefined 
        });
        setGrandLivreData(data);
      }
    } catch (err) {
      console.error('Erreur chargement rapport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedChantierFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header (Hidden in Print) ── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Rapports & États Financiers Officiels</span>
          </h1>
          <p className="text-xs text-slate-500">
            Bilans de trésorerie consolidés, journaux de caisse et grand livre des dépenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selector */}
          <div className="flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('tresorerie')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'tresorerie' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bilan Trésorerie & Caisses
            </button>
            <button
              onClick={() => setActiveTab('grandlivre')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'grandlivre' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grand Livre des Dépenses
            </button>
          </div>

          {activeTab === 'grandlivre' && (
            <select
              value={selectedChantierFilter}
              onChange={(e) => setSelectedChantierFilter(e.target.value)}
              className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">Tous les chantiers</option>
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimer l'État A4</span>
          </button>
        </div>
      </div>

      {/* ── Official Document Paper Container (Print-Ready) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none space-y-6">
        
        {/* Document Official Header */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {companySettings?.logo_url ? (
                <div className="w-16 h-16 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                  <img src={companySettings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  BP
                </div>
              )}
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  {companySettings?.company_name || 'BATIPROMO IMMOBILIER ALGERIE'}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {companySettings?.forme_juridique || 'SARL'} au Capital de {formatDA(companySettings?.capital_social || 50000000)}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Agrément Promoteur N° {companySettings?.agrement_promoteur || 'AGR-MIN-HABITAT-2021-0487'} • NIF: {companySettings?.nif || '002116010987654'} • RC: {companySettings?.registre_commerce || '16/00-0987654B21'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-slate-900 text-xs font-black uppercase tracking-wider border border-slate-300">
                Document Comptable Officiel
              </span>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Date d'édition : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">Devise : Dinar Algérien (DA)</p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: BILAN TRESORERIE                                             */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'tresorerie' && (
          <div className="space-y-6">
            <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                État Récapitulatif de la Trésorerie & des Caisses de Fond de Roulement
              </h2>
              <p className="text-xs text-slate-500">
                Situation financière consolidée des comptes bancaires et des caisses chantiers
              </p>
            </div>

            {/* KPI Cards in Print Document */}
            {tresorerieData?.totaux && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Trésorerie Globale</span>
                  <div className="text-lg font-black text-emerald-900 font-mono">{formatDA(tresorerieData.totaux.totalTresorerie)}</div>
                  <span className="text-[10px] text-emerald-700">Tous comptes & caisses</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Comptes Bancaires</span>
                  <div className="text-lg font-black text-blue-900 font-mono">{formatDA(tresorerieData.totaux.totalBanques)}</div>
                  <span className="text-[10px] text-blue-700">BNA, CPA, BEA</span>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block mb-1">Caisses Fond de Roulement</span>
                  <div className="text-lg font-black text-indigo-900 font-mono">{formatDA(tresorerieData.totaux.totalFDR)}</div>
                  <span className="text-[10px] text-indigo-700">Chantiers opérationnels</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Caisse Centrale Siège</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{formatDA(tresorerieData.totaux.totalCentrale)}</div>
                  <span className="text-[10px] text-slate-600">Espèces disponibles</span>
                </div>
              </div>
            )}

            {/* Caisses Details Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Détail des Soldes par Caisse & Compte
              </h3>
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Caisse / Compte</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Chantier Associé</th>
                    <th className="py-2 px-3">Banque / RIB</th>
                    <th className="py-2 px-3 text-right">Solde Actuel (DA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {tresorerieData?.caisses?.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold">{c.name}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">{c.type}</td>
                      <td className="py-2 px-3 text-slate-700">{c.chantier_name || 'Siège Central'}</td>
                      <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">{c.bank_name || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatDA(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Last Validated Operations Journal */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Journal Récent des Décaissements Validés par la Direction
              </h3>
              <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Réf. Bon</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Chantier</th>
                    <th className="py-2 px-3">Motif & Bénéficiaire</th>
                    <th className="py-2 px-3">Visa Validateur</th>
                    <th className="py-2 px-3 text-right">Montant (DA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {tresorerieData?.recentOperations?.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.reference}</td>
                      <td className="py-2 px-3 text-slate-500">{formatDate(m.date)}</td>
                      <td className="py-2 px-3">{m.chantier_name || 'Siège'}</td>
                      <td className="py-2 px-3 max-w-[200px] truncate">
                        <span className="font-semibold">{m.motif}</span>
                        {m.beneficiaire_name && <span className="block text-[10px] text-slate-400">{m.beneficiaire_name}</span>}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {m.validator_name || 'Direction'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                        -{formatDA(m.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: GRAND LIVRE DES DEPENSES                                     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === 'grandlivre' && (
          <div className="space-y-6">
            <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Grand Livre des Dépenses, Achats & Factures Fournisseurs
              </h2>
              <p className="text-xs text-slate-500">
                Suivi exhaustif des engagements financiers, montants payés et soldes fournisseurs
              </p>
            </div>

            {grandLivreData?.totaux && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Total Engagé</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{formatDA(grandLivreData.totaux.totalEngage)}</div>
                  <span className="text-[10px] text-slate-500">{grandLivreData.totaux.nombreFactures} factures/pièces</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Montant Réglé</span>
                  <div className="text-lg font-black text-emerald-900 font-mono">{formatDA(grandLivreData.totaux.totalPaye)}</div>
                  <span className="text-[10px] text-emerald-700">Décaissements effectués</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-800 uppercase block mb-1">Reste à Régler</span>
                  <div className="text-lg font-black text-rose-900 font-mono">{formatDA(grandLivreData.totaux.totalReste)}</div>
                  <span className="text-[10px] text-rose-700">Dettes fournisseurs en cours</span>
                </div>
              </div>
            )}

            {/* Expenses List */}
            <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Réf. Facture</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Fournisseur / Tiers</th>
                  <th className="py-2 px-3">Chantier</th>
                  <th className="py-2 px-3">Catégorie</th>
                  <th className="py-2 px-3 text-right">Total (DA)</th>
                  <th className="py-2 px-3 text-right">Payé (DA)</th>
                  <th className="py-2 px-3 text-right">Reste Dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {grandLivreData?.depenses?.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{d.reference}</td>
                    <td className="py-2 px-3 text-slate-500">{formatDate(d.date)}</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-900">{d.fournisseur_name || d.beneficiaire_name || '-'}</span>
                    </td>
                    <td className="py-2 px-3">{d.chantier_name}</td>
                    <td className="py-2 px-3 text-[11px] text-slate-500">{d.categorie}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{formatDA(d.montant_total)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatDA(d.montant_paye)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                      {formatDA(d.montant_total - d.montant_paye)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Official Signatures & Stamp Section (Visible in Print) ── */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="p-4 border border-dashed border-slate-300 rounded-2xl min-h-[110px] flex flex-col justify-between">
            <span className="font-bold text-slate-700 uppercase">Le Chef Comptable / Conducteur</span>
            <span className="text-[10px] text-slate-400 italic">Signature & Date</span>
          </div>

          <div className="p-4 border border-dashed border-slate-300 rounded-2xl min-h-[110px] flex flex-col justify-between items-center">
            <span className="font-bold text-slate-700 uppercase">Visa & Cachet de la Direction Générale</span>
            {companySettings?.cachet_url ? (
              <img src={companySettings.cachet_url} alt="Cachet" className="max-h-16 object-contain my-1" />
            ) : (
              <span className="text-[10px] text-slate-400 italic">Cachet Officiel</span>
            )}
          </div>
        </div>

        {/* Legal Footer */}
        <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
          <p>{companySettings?.mention_legale_documents || 'Document généré par le Système ERP BATIPROMO DZ'}</p>
          <p>{companySettings?.pied_de_page_documents || 'Val d\'Hydra, Alger, Algérie'}</p>
        </div>

      </div>
    </div>
  );
}
