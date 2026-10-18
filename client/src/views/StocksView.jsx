import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA, formatDACompact, formatDate } from '../utils/formatters';

export default function StocksView({ chantiers = [] }) {
  const [subTab, setSubTab] = useState('articles'); // 'articles', 'niveaux', 'mouvements'
  const [articles, setArticles] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedChantier, setSelectedChantier] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showNewArticleModal, setShowNewArticleModal] = useState(false);
  const [showMvtModal, setShowMvtModal] = useState(false);

  // Form states
  const [newArt, setNewArt] = useState({
    code_article: '',
    designation: '',
    categorie: 'GROS_OEUVRE',
    unite: 'Sac 50kg',
    prix_unitaire_moyen: '',
    stock_min_alerte: '20'
  });

  const [mvtForm, setMvtForm] = useState({
    article_id: '',
    type_mouvement: 'ENTREE_ACHAT',
    quantite: '',
    prix_unitaire: '',
    chantier_destination_id: '',
    chantier_source_id: '',
    numero_bl: '',
    motif: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'articles') {
        const data = await api.getArticles({ search: search || undefined });
        setArticles(data);
      } else if (subTab === 'niveaux') {
        const data = await api.getNiveauxStock({ chantier_id: selectedChantier || undefined });
        setNiveaux(data);
      } else if (subTab === 'mouvements') {
        const data = await api.getMouvementsStock({ chantier_id: selectedChantier || undefined });
        setMouvements(data);
      }
    } catch (e) {
      console.error('Error loading stocks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedChantier, search]);

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    try {
      await api.createArticle(newArt);
      setShowNewArticleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création article');
    }
  };

  const handleCreateMouvement = async (e) => {
    e.preventDefault();
    try {
      await api.createMouvementStock(mvtForm);
      setShowMvtModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur mouvement stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Stocks & Matériaux BTP</h1>
          <p className="text-xs text-slate-500">
            Suivi multi-dépôts (Dépôt Central & chantiers), entrées de livraison (BL), sorties de consommation et alertes de seuil critique
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMvtModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Nouveau Bon (Entrée / Sortie / Transfert)
          </button>
          <button
            onClick={() => setShowNewArticleModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nouvel Article Catalogue
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('articles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'articles' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Package className="w-4 h-4" />
            Catalogue & Alertes ({articles.length})
          </button>
          <button
            onClick={() => setSubTab('niveaux')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'niveaux' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Building className="w-4 h-4" />
            Quantités par Chantier & Dépôt
          </button>
          <button
            onClick={() => setSubTab('mouvements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'mouvements' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Mouvements & Bons de Réception
          </button>
        </div>

        {subTab !== 'articles' && (
          <select
            value={selectedChantier}
            onChange={(e) => setSelectedChantier(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
          >
            <option value="">Tous les Emplacements</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* SUB-VIEW 1: CATALOGUE */}
      {subTab === 'articles' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Catalogue des Matériaux & État des Stocks Globaux
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Code Article</th>
                <th className="py-2.5 px-3">Désignation</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3">Unité</th>
                <th className="py-2.5 px-3 font-mono">Stock Global</th>
                <th className="py-2.5 px-3 font-mono">Dépôt Central</th>
                <th className="py-2.5 px-3 font-mono">Sur Chantiers</th>
                <th className="py-2.5 px-3 text-right">P.U Moyen (DA)</th>
                <th className="py-2.5 px-3 text-right">Valeur Stock (DA)</th>
                <th className="py-2.5 px-3 text-center">Alerte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {articles.map((art) => {
                const isAlert = art.is_alerte === 1;
                return (
                  <tr key={art.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{art.code_article}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{art.designation}</td>
                    <td className="py-2.5 px-3 text-slate-600">{art.categorie}</td>
                    <td className="py-2.5 px-3 text-slate-600">{art.unite}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sm">
                      <span className={isAlert ? 'text-rose-600' : 'text-slate-900'}>{art.stock_total}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{art.stock_depot_central}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">{art.stock_chantiers}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatDA(art.prix_unitaire_moyen)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(art.valeur_totale_da)}</td>
                    <td className="py-2.5 px-3 text-center">
                      {isAlert ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          Stock Bas (&lt; {art.stock_min_alerte})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 2: NIVEAUX */}
      {subTab === 'niveaux' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Quantités Réelles par Emplacement
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Emplacement / Chantier</th>
                <th className="py-2.5 px-3">Code Article</th>
                <th className="py-2.5 px-3">Désignation</th>
                <th className="py-2.5 px-3">Quantité en Stock</th>
                <th className="py-2.5 px-3">Unité</th>
                <th className="py-2.5 px-3 text-right">Valeur Estimée (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {niveaux.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-blue-700">{n.emplacement_nom}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{n.code_article}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{n.designation}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sm text-slate-900">{n.quantite}</td>
                  <td className="py-2.5 px-3 text-slate-600">{n.unite}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(n.quantite * n.prix_unitaire_moyen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 3: MOUVEMENTS */}
      {subTab === 'mouvements' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Journal des Bons d'Entrée (BL), Bons de Sortie et Transferts
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3">Réf. Bon</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Article</th>
                <th className="py-2.5 px-3">Quantité</th>
                <th className="py-2.5 px-3">Origine &rarr; Destination</th>
                <th className="py-2.5 px-3">N° BL / Motif</th>
                <th className="py-2.5 px-3 text-right">Montant (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {mouvements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{m.reference_bon}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(m.date_mouvement)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.type_mouvement === 'ENTREE_ACHAT' ? 'bg-emerald-100 text-emerald-800' : (m.type_mouvement === 'SORTIE_CONSOMMATION' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800')
                    }`}>
                      {m.type_mouvement}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{m.article_designation}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sm text-blue-700">
                    {m.quantite} {m.unite}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {m.source_nom || 'Fournisseur'} &rarr; {m.destination_nom || 'Chantier'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate">{m.numero_bl || m.motif}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatDA(m.montant_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL NEW ARTICLE */}
      {showNewArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Nouvel Article au Catalogue BTP</h3>
            <form onSubmit={handleCreateArticle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Désignation Matériau *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ciment Blanc CPJ 42.5"
                  value={newArt.designation}
                  onChange={(e) => setNewArt({ ...newArt, designation: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Catégorie</label>
                  <select
                    value={newArt.categorie}
                    onChange={(e) => setNewArt({ ...newArt, categorie: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="GROS_OEUVRE">Gros Œuvre (Ciment, Briques)</option>
                    <option value="ACIER_FERRAILLAGE">Acier & Ferraillage</option>
                    <option value="AGREGATS">Agrégats (Sable, Gravier)</option>
                    <option value="REVETEMENT">Revêtement & Céramique</option>
                    <option value="PLATRERIE">Plâtrerie & Isolation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unité</label>
                  <select
                    value={newArt.unite}
                    onChange={(e) => setNewArt({ ...newArt, unite: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="Sac 50kg">Sac 50kg</option>
                    <option value="Tonne">Tonne</option>
                    <option value="m³">m³</option>
                    <option value="m²">m²</option>
                    <option value="Unité">Unité</option>
                    <option value="Palette">Palette</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Prix Unitaire Moyen (DA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 650"
                    value={newArt.prix_unitaire_moyen}
                    onChange={(e) => setNewArt({ ...newArt, prix_unitaire_moyen: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Seuil Alerte Stock Bas</label>
                  <input
                    type="number"
                    value={newArt.stock_min_alerte}
                    onChange={(e) => setNewArt({ ...newArt, stock_min_alerte: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowNewArticleModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Créer Article</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOUVEAU MOUVEMENT STOCK */}
      {showMvtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Enregistrer un Bon de Mouvement de Stock</h3>
            <form onSubmit={handleCreateMouvement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Type de Mouvement *</label>
                  <select
                    value={mvtForm.type_mouvement}
                    onChange={(e) => setMvtForm({ ...mvtForm, type_mouvement: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="ENTREE_ACHAT">Entrée / Livraison BL Fournisseur</option>
                    <option value="SORTIE_CONSOMMATION">Sortie pour Travaux sur Chantier</option>
                    <option value="TRANSFERT">Transfert Inter-Chantiers / Dépôt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Article BTP *</label>
                  <select
                    required
                    value={mvtForm.article_id}
                    onChange={(e) => setMvtForm({ ...mvtForm, article_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Sélectionner article...</option>
                    {articles.map((art) => (
                      <option key={art.id} value={art.id}>{art.code_article} - {art.designation}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Quantité *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 250"
                    value={mvtForm.quantite}
                    onChange={(e) => setMvtForm({ ...mvtForm, quantite: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Prix Unitaire (DA)</label>
                  <input
                    type="number"
                    placeholder="Ex: 650"
                    value={mvtForm.prix_unitaire}
                    onChange={(e) => setMvtForm({ ...mvtForm, prix_unitaire: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Chantier Destination / Réception</label>
                  <select
                    value={mvtForm.chantier_destination_id}
                    onChange={(e) => setMvtForm({ ...mvtForm, chantier_destination_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Dépôt Central Chéraga</option>
                    {chantiers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">N° Bon de Livraison (BL)</label>
                  <input
                    type="text"
                    placeholder="Ex: BL-BET-2026-90"
                    value={mvtForm.numero_bl}
                    onChange={(e) => setMvtForm({ ...mvtForm, numero_bl: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Motif / Affectation de la Dalle ou Voile</label>
                <input
                  type="text"
                  placeholder="Ex: Coulage dalle niveau R+7"
                  value={mvtForm.motif}
                  onChange={(e) => setMvtForm({ ...mvtForm, motif: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowMvtModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">Valider le Bon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
