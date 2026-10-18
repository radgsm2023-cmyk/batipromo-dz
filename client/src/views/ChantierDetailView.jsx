import React, { useState, useEffect } from 'react';
import { 
  Building, 
  ArrowLeft, 
  Wallet, 
  Users, 
  Truck, 
  Package, 
  Receipt, 
  FileCheck2, 
  FolderLock, 
  Calendar, 
  MapPin, 
  Printer, 
  Plus, 
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate, getStatusBadge } from '../utils/formatters';

export default function ChantierDetailView({ chantierId, onBack, onOpenPrintBon, onOpenNewMouvement }) {
  const [chantier, setChantier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('apercu');

  const loadChantier = async () => {
    try {
      setLoading(true);
      const data = await api.getChantierById(chantierId);
      setChantier(data);
    } catch (e) {
      console.error('Error fetching chantier detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chantierId) {
      loadChantier();
    }
  }, [chantierId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-slate-500">
        Chargement du dossier complet du chantier...
      </div>
    );
  }

  if (!chantier) {
    return (
      <div className="p-8 text-center text-xs text-rose-600">
        Chantier introuvable.
        <button onClick={onBack} className="block mx-auto mt-3 text-blue-600 underline">Retour</button>
      </div>
    );
  }

  const badge = getStatusBadge(chantier.status);
  const caisseSolde = chantier.caisse ? chantier.caisse.balance : 0;
  const isCaisseAlert = chantier.caisse ? caisseSolde <= chantier.caisse.seuil_alerte : false;

  const tabs = [
    { id: 'apercu', label: 'Aperçu & Planning', icon: Building },
    { id: 'caisse', label: 'Fond de Roulement', icon: Wallet, badge: formatDACompact(caisseSolde) },
    { id: 'personnel', label: 'Personnel & Ouvriers', icon: Users, count: chantier.personnel?.length || 0 },
    { id: 'materiel', label: 'Matériel & Engins', icon: Truck, count: chantier.materiel?.length || 0 },
    { id: 'stocks', label: 'Stocks Matériaux', icon: Package, count: chantier.stocks?.length || 0 },
    { id: 'depenses', label: 'Dépenses & Factures', icon: Receipt, count: chantier.depenses?.length || 0 },
    { id: 'ventes', label: 'Ventes & Lots', icon: FileCheck2, count: chantier.ventes?.length || 0 },
    { id: 'documents', label: 'Documents & GED', icon: FolderLock, count: chantier.documents?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Retour aux chantiers"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {chantier.code}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {chantier.wilaya} ({chantier.commune})
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{chantier.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Caisse FDR Badge */}
            <div className={`px-4 py-2 rounded-xl border text-right ${isCaisseAlert ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block">Solde Caisse FDR</span>
              <span className="text-base font-extrabold font-mono">{formatDA(caisseSolde)}</span>
            </div>

            <button
              onClick={() => onOpenNewMouvement(chantier.caisse?.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Nouveau Bon de Caisse
            </button>
          </div>
        </div>

        {/* Tab navigation pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-3 text-xs font-semibold">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'}`}>
                    {tab.badge}
                  </span>
                )}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Aperçu & Planning */}
      {activeTab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Characteristics */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Caractéristiques & Descriptif du Projet</h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {chantier.description || 'Aucune description saisie.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Type d'Immeuble :</span>
                  <strong className="text-slate-800">{chantier.type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Surface Totale Développée :</span>
                  <strong className="text-slate-800">{chantier.surface_totale_m2 ? `${chantier.surface_totale_m2} m²` : '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Nombre de Logements / Lots :</span>
                  <strong className="text-slate-800">{chantier.nombre_unites || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Conducteur / Chef Projet :</span>
                  <strong className="text-slate-800">{chantier.chef_chantier_name || 'Non assigné'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date Début des Travaux :</span>
                  <strong className="text-slate-800">{formatDate(chantier.start_date)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date Fin Prévisionnelle :</span>
                  <strong className="text-slate-800">{formatDate(chantier.end_date_planned)}</strong>
                </div>
              </div>
            </div>

            {/* Budget & Financial Progress */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Consommation Budgétaire (DZD)</h2>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-500">
                  Dépenses Cumulées : <strong className="text-slate-900 font-mono">{formatDA(chantier.depenses?.reduce((acc, d) => acc + d.montant_total, 0) || 0)}</strong>
                </span>
                <span className="text-slate-500">
                  Budget Total Alloué : <strong className="text-slate-900 font-mono">{formatDA(chantier.budget_total)}</strong>
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${chantier.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Quick Status & Alerts */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3">Synthèse des Ressources Chantier</h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-semibold text-slate-700">Personnel Affecté</span>
                  </div>
                  <strong className="text-slate-900 font-mono text-sm">{chantier.personnel?.length || 0} ouvriers</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-slate-700">Matériel & Engins</span>
                  </div>
                  <strong className="text-slate-900 font-mono text-sm">{chantier.materiel?.length || 0} machines</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-700">Articles en Stock</span>
                  </div>
                  <strong className="text-slate-900 font-mono text-sm">{chantier.stocks?.length || 0} références</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">Lots Réservés / Vendus</span>
                  </div>
                  <strong className="text-slate-900 font-mono text-sm">{chantier.ventes?.length || 0} acquéreurs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Caisse de Fond de Roulement Dédiée */}
      {activeTab === 'caisse' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">{chantier.caisse?.name || 'Fond de Roulement Chantier'}</h2>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {chantier.caisse?.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Seuil d'alerte de sécurité de caisse : <strong className="text-slate-700">{formatDA(chantier.caisse?.seuil_alerte || 50000)}</strong>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Solde Liquide Disponible</span>
                <span className={`text-xl font-black font-mono ${isCaisseAlert ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatDA(caisseSolde)}
                </span>
              </div>
              <button
                onClick={() => onOpenNewMouvement(chantier.caisse?.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                + Décaissement / Bon
              </button>
            </div>
          </div>

          {/* Movements table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
              Historique des Mouvements & Pièces de Caisse du Chantier
            </div>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Réf. Bon</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Motif & Justification</th>
                  <th className="py-2.5 px-3">Bénéficiaire / Tiers</th>
                  <th className="py-2.5 px-3 text-right">Montant (DA)</th>
                  <th className="py-2.5 px-3 text-center">Bon Officiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {chantier.mouvementsCaisse?.map((mvt) => {
                  const isSortie = mvt.type === 'SORTIE';
                  return (
                    <tr key={mvt.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-mono font-bold">{mvt.reference}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDate(mvt.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSortie ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {mvt.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-[260px] truncate">{mvt.motif}</td>
                      <td className="py-2.5 px-3">{mvt.beneficiaire_name || mvt.fournisseur_name || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={isSortie ? 'text-rose-600' : 'text-emerald-600'}>
                          {isSortie ? '-' : '+'}{formatDA(mvt.montant)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onOpenPrintBon({ ...mvt, caisse_name: chantier.caisse?.name, chantier_name: chantier.name, chantier_code: chantier.code })}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                        >
                          Imprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Personnel Affecté */}
      {activeTab === 'personnel' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Main d'Œuvre & Salariés Actuellement Affectés au Chantier
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Nom & Prénom</th>
                <th className="py-2.5 px-3">Poste / Rôle sur Chantier</th>
                <th className="py-2.5 px-3">Type de Contrat</th>
                <th className="py-2.5 px-3">Rémunération (DA)</th>
                <th className="py-2.5 px-3">Téléphone</th>
                <th className="py-2.5 px-3 text-center">Présence (30j)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {chantier.personnel?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{p.matricule}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.nom} {p.prenom}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">{p.role_sur_chantier || p.poste}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.type_contrat === 'PERMANENT_MENSUEL' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                      {p.type_contrat === 'PERMANENT_MENSUEL' ? 'Mensuel' : 'Journalier / Tâcheron'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {p.type_contrat === 'PERMANENT_MENSUEL' ? `${formatDA(p.salaire_base)}/mois` : `${formatDA(p.taux_journalier)}/jour`}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.telephone || '-'}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {p.jours_presence_30j || 0} jours
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Matériel & Engins */}
      {activeTab === 'materiel' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Engins et Équipements en Service sur le Chantier (Interne & Loué)
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code Parc</th>
                <th className="py-2.5 px-3">Nom de l'Équipement</th>
                <th className="py-2.5 px-3">Propriété</th>
                <th className="py-2.5 px-3">Opérateur / Chauffeur</th>
                <th className="py-2.5 px-3">Coût Imputé (DA)</th>
                <th className="py-2.5 px-3">Date d'Affectation</th>
                <th className="py-2.5 px-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {chantier.materiel?.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{m.code_parc}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{m.nom}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.type_propriete === 'INTERNE' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                      {m.type_propriete}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{m.operateur_name || 'Non assigné'}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    {m.cout_location_jour > 0 ? `${formatDA(m.cout_location_jour)}/j` : (m.cout_location_mois > 0 ? `${formatDA(m.cout_location_mois)}/mois` : 'Interne')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(m.date_affectation)}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {m.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Stocks */}
      {activeTab === 'stocks' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Matériaux & Approvisionnements Stockés sur le Chantier
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code Article</th>
                <th className="py-2.5 px-3">Désignation Matériau</th>
                <th className="py-2.5 px-3">Quantité en Stock</th>
                <th className="py-2.5 px-3">Unité</th>
                <th className="py-2.5 px-3">Prix Unitaire Moyen</th>
                <th className="py-2.5 px-3 text-right">Valeur Estimée (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {chantier.stocks?.map((stk, i) => (
                <tr key={i} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{stk.code_article}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{stk.designation}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sm text-blue-700">{stk.quantite}</td>
                  <td className="py-2.5 px-3 text-slate-600">{stk.unite}</td>
                  <td className="py-2.5 px-3 font-mono">{formatDA(stk.prix_unitaire_moyen)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(stk.valeur_stock)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Dépenses */}
      {activeTab === 'depenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Factures & Dépenses du Chantier
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Dépense</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Fournisseur / Bénéficiaire</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Montant Total</th>
                <th className="py-2.5 px-3 text-right">Montant Payé</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {chantier.depenses?.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold">{d.reference}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(d.date)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{d.fournisseur_name || d.beneficiaire_name || '-'}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px]">{d.categorie}</span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[220px] truncate">{d.description}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(d.montant_total)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatDA(d.montant_paye)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.statut_paiement === 'PAYE' ? 'bg-emerald-100 text-emerald-800' : (d.statut_paiement === 'PARTIEL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}`}>
                      {d.statut_paiement}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 7: Ventes */}
      {activeTab === 'ventes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Acquéreurs & Commercialisation des Lots de ce Projet
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Contrat</th>
                <th className="py-2.5 px-3">Client / Acquéreur</th>
                <th className="py-2.5 px-3">Désignation du Lot</th>
                <th className="py-2.5 px-3">Surface</th>
                <th className="py-2.5 px-3 text-right">Prix Total (DA)</th>
                <th className="py-2.5 px-3 text-right">Versé (DA)</th>
                <th className="py-2.5 px-3 text-right">Reste Dû (DA)</th>
                <th className="py-2.5 px-3 text-center">Statut Acte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {chantier.ventes?.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{v.reference_contrat}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{v.client_nom} {v.client_prenom}</td>
                  <td className="py-2.5 px-3 max-w-[220px] truncate">{v.lot_designation}</td>
                  <td className="py-2.5 px-3">{v.surface_m2} m²</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{formatDA(v.prix_total)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatDA(v.montant_verse)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700">{formatDA(v.reste_a_payer)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                      {v.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 8: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Plans d'Architecte, Permis de Construire & Rapports CTC
          </div>
          <div className="divide-y divide-slate-100 p-4 space-y-3">
            {chantier.documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{doc.titre}</h3>
                    <p className="text-[11px] text-slate-400">Date: {formatDate(doc.date_document)} • Type: {doc.type_document}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Téléchargement de : ${doc.file_name}`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Télécharger / Visualiser
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
