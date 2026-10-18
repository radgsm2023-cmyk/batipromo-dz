import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Trash2, 
  Check, 
  Save, 
  FileText, 
  Wallet, 
  Users, 
  ShieldCheck, 
  Database, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Landmark, 
  Phone, 
  Mail, 
  MapPin, 
  Stamp, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import { formatDA } from '../utils/formatters';

export default function SettingsView({ currentUser, onSettingsUpdated }) {
  const [activeTab, setActiveTab] = useState('identity');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCachet, setUploadingCachet] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const logoInputRef = useRef(null);
  const cachetInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    company_name: 'BATIPROMO DZ',
    sigle: 'BATIPROMO',
    forme_juridique: 'SARL',
    capital_social: 50000000,
    agrement_promoteur: 'AGR-MIN-HABITAT-2021-0487',
    date_agrement: '2021-03-15',
    registre_commerce: '16/00-0987654B21',
    nif: '002116010987654',
    nis: '098765432101234',
    article_imposition: '16010987654',
    adresse_siege: "14, Boulevard du 11 Décembre 1960, Val d'Hydra",
    commune: 'Hydra',
    wilaya: 'Alger',
    code_postal: '16035',
    telephone_1: '+213 (0) 23 45 67 89',
    telephone_2: '+213 (0) 550 12 34 56',
    fax: '+213 (0) 23 45 67 90',
    email_contact: 'contact@batipromo.dz',
    email_direction: 'direction@batipromo.dz',
    site_web: 'https://www.batipromo.dz',
    rib_principal: '001 00234 0300012345 67',
    banque_principale: "Banque Nationale d'Algérie (BNA) - Agence Didouche Mourad Alger",
    logo_url: '',
    cachet_url: '',
    devise_nom: 'Dinar Algérien',
    devise_code: 'DZD',
    devise_symbole: 'DA',
    seuil_validation_caisse: 100000,
    exiger_validation_toutes_sorties: 1,
    seuil_alerte_caisse_defaut: 150000,
    taux_cnas_salarie: 9.0,
    taux_cnas_patronal: 26.0,
    heures_jour_travail: 8.0,
    jours_ouvrables_mois: 22,
    mention_legale_documents: 'Document comptable officiel BATIPROMO DZ - Généré par le Système Intégré de Gestion de Promotion Immobilière',
    pied_de_page_documents: "BATIPROMO DZ SARL au Capital de 50 000 000 DA - Agrément Promoteur Immobilier N° AGR-MIN-HABITAT-2021-0487 - Val d'Hydra, Alger"
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      if (data) {
        setFormData(prev => ({
          ...prev,
          ...data,
          capital_social: Number(data.capital_social) || 50000000,
          seuil_validation_caisse: Number(data.seuil_validation_caisse) || 100000,
          seuil_alerte_caisse_defaut: Number(data.seuil_alerte_caisse_defaut) || 150000,
          taux_cnas_salarie: Number(data.taux_cnas_salarie) || 9.0,
          taux_cnas_patronal: Number(data.taux_cnas_patronal) || 26.0,
          heures_jour_travail: Number(data.heures_jour_travail) || 8.0,
          jours_ouvrables_mois: Number(data.jours_ouvrables_mois) || 22
        }));
      }
    } catch (e) {
      console.error('Error loading settings:', e);
      setFeedback({ type: 'error', text: 'Impossible de charger les paramètres de configuration.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      const res = await api.updateSettings({
        ...formData,
        updated_by: currentUser?.id
      });
      setFeedback({ type: 'success', text: res.message || 'Paramètres enregistrés avec succès !' });
      if (onSettingsUpdated) {
        onSettingsUpdated(res.settings);
      }
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('logo', file);

    try {
      setUploadingLogo(true);
      setFeedback(null);
      const res = await api.uploadLogo(data);
      setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
      setFeedback({ type: 'success', text: 'Logo officiel importé avec succès !' });
      if (onSettingsUpdated) onSettingsUpdated(res.settings);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors du téléversement du logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm('Voulez-vous réinitialiser le logo de l\'entreprise ?')) return;
    try {
      await api.deleteLogo();
      setFormData(prev => ({ ...prev, logo_url: '' }));
      setFeedback({ type: 'success', text: 'Logo supprimé avec succès.' });
      if (onSettingsUpdated) onSettingsUpdated({ ...formData, logo_url: '' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    }
  };

  const handleCachetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('cachet', file);

    try {
      setUploadingCachet(true);
      setFeedback(null);
      const res = await api.uploadCachet(data);
      setFormData(prev => ({ ...prev, cachet_url: res.cachet_url }));
      setFeedback({ type: 'success', text: 'Cachet & griffe officielle importés avec succès !' });
      if (onSettingsUpdated) onSettingsUpdated(res.settings);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors du téléversement du cachet' });
    } finally {
      setUploadingCachet(false);
    }
  };

  const handleDeleteCachet = async () => {
    if (!window.confirm('Voulez-vous supprimer le cachet officiel ?')) return;
    try {
      await api.deleteCachet();
      setFormData(prev => ({ ...prev, cachet_url: '' }));
      setFeedback({ type: 'success', text: 'Cachet supprimé.' });
      if (onSettingsUpdated) onSettingsUpdated({ ...formData, cachet_url: '' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Erreur suppression cachet' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">Chargement des paramètres de l'application...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'identity', label: 'Identité Visuelle & Logo', icon: Sparkles },
    { id: 'company', label: 'Promoteur & Entreprise', icon: Building2 },
    { id: 'caisses', label: 'Trésorerie & Contrôle', icon: Wallet },
    { id: 'rh', label: 'RH & Paramètres Paie', icon: Users },
    { id: 'documents', label: 'Documents & Mentions', icon: FileText },
    { id: 'system', label: 'Sauvegarde & Système', icon: Database }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Paramétrage Centralisé de l'Application
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Personnalisation complète : logo officiel, agrément de promoteur immobilier, coordonnées légales, règles de validation et sauvegardes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition self-start sm:self-auto"
        >
          {saving ? (
            <span>Enregistrement...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Enregistrer les Paramètres</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold transition ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: IDENTITÉ VISUELLE & LOGO                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Uploaders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Logo Upload Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Logo Officiel du Promoteur</h2>
                  <p className="text-xs text-slate-500">
                    S'affiche sur la barre supérieure, l'écran de connexion et l'ensemble des bons officiels
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  PNG, SVG, JPG
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                {/* Logo Preview Box */}
                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-3 shrink-0 overflow-hidden relative group">
                  {formData.logo_url ? (
                    <img 
                      src={formData.logo_url} 
                      alt="Logo Promoteur" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto mb-1 opacity-40 text-blue-600" />
                      <span className="text-[10px] font-semibold block">Logo Défaut</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="text-xs text-slate-600">
                    {formData.logo_url ? (
                      <p className="font-semibold text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                        <Check className="w-4 h-4" /> Logo personnalisé actif
                      </p>
                    ) : (
                      <p className="text-slate-500">
                        Aucun logo importé. Le logo générique BATIPROMO DZ est actuellement utilisé.
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Format recommandé : image avec fond transparent (hauteur max 200px).
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadingLogo ? 'Importation...' : 'Importer un Logo'}</span>
                    </button>

                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={handleDeleteLogo}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cachet & Tampon Officiel Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Cachet & Griffe Officielle de la Société</h2>
                  <p className="text-xs text-slate-500">
                    Inséré automatiquement dans la case de signature « Visa Direction Générale » sur les bons
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                  Tampon Numérique
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
                <div className="w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-3 shrink-0 overflow-hidden">
                  {formData.cachet_url ? (
                    <img 
                      src={formData.cachet_url} 
                      alt="Cachet Promoteur" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <Stamp className="w-10 h-10 mx-auto mb-1 opacity-30 text-purple-600" />
                      <span className="text-[10px] font-semibold block">Aucun Cachet</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <div className="text-xs text-slate-600">
                    {formData.cachet_url ? (
                      <p className="font-semibold text-purple-700 flex items-center justify-center sm:justify-start gap-1">
                        <Check className="w-4 h-4" /> Cachet numérique prêt pour apposition
                      </p>
                    ) : (
                      <p className="text-slate-500">
                        Importez un scan détouré du cachet rond et de la griffe du Directeur Général.
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Format idéal : PNG transparent fond blanc.
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={cachetInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleCachetUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => cachetInputRef.current?.click()}
                      disabled={uploadingCachet}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadingCachet ? 'Importation...' : 'Importer le Cachet'}</span>
                    </button>

                    {formData.cachet_url && (
                      <button
                        type="button"
                        onClick={handleDeleteCachet}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Document Preview Specimen (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Aperçu en Direct sur Document Officiel
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Spécimen Bon</span>
              </div>

              {/* Mini Bon Specimen */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-[11px] space-y-3 font-sans">
                {/* Header with real imported logo */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-2">
                  <div className="flex items-center gap-2">
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                        BP
                      </div>
                    )}
                    <div>
                      <div className="font-black text-xs text-slate-900 leading-tight">
                        {formData.company_name || 'BATIPROMO DZ'}
                      </div>
                      <div className="text-[9px] text-slate-500">{formData.adresse_siege || 'Hydra, Alger'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-800 uppercase">
                      BON DE DÉCAISSEMENT
                    </span>
                    <div className="font-mono text-[9px] text-slate-500 mt-0.5">N° BC-2026-EXEMPLE</div>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 text-[10px]">Montant en Dinars :</span>
                  <span className="font-mono font-bold text-xs text-rose-700">185 000,00 DA</span>
                </div>

                {/* Signatures with Cachet apposition */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-center min-h-[60px] flex flex-col justify-between">
                    <span className="text-[9px] text-slate-500 font-bold">Le Caissier</span>
                    <span className="text-[8px] text-slate-400 italic">Signature</span>
                  </div>
                  <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-300 text-center min-h-[60px] flex flex-col justify-between items-center relative overflow-hidden">
                    <span className="text-[9px] text-emerald-800 font-bold">Visa Direction (Admin)</span>
                    {formData.cachet_url ? (
                      <img 
                        src={formData.cachet_url} 
                        alt="Cachet" 
                        className="w-10 h-10 object-contain my-0.5" 
                      />
                    ) : (
                      <span className="text-[8px] text-emerald-700 font-bold">✓ APPROUVÉ</span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center italic">
                Ce spécimen illustre comment votre logo et votre cachet apparaîtront lors de l'impression des bons et états.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: PROMOTEUR & INFORMATIONS JURIDIQUES                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Informations Légales du Promoteur Immobilier</h2>
              <p className="text-xs text-slate-500">
                Données officielles figurant sur les contrats de vente notariés, bons de caisse et déclarations
              </p>
            </div>

            {/* General Company Identifiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Raison Sociale Complète *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Ex: BATIPROMO DZ PROMOTION IMMOBILIERE"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sigle / Nom Court
                </label>
                <input
                  type="text"
                  value={formData.sigle}
                  onChange={(e) => handleChange('sigle', e.target.value)}
                  placeholder="Ex: BATIPROMO"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forme Juridique
                </label>
                <select
                  value={formData.forme_juridique}
                  onChange={(e) => handleChange('forme_juridique', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                  <option value="EURL">EURL (Entreprise Unipersonnelle à R.L.)</option>
                  <option value="SPA">SPA (Société Par Actions)</option>
                  <option value="SNC">SNC (Société en Nom Collectif)</option>
                  <option value="ENTREPRISE_INDIVIDUELLE">Entreprise Individuelle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  N° Agrément Promoteur Immobilier *
                </label>
                <input
                  type="text"
                  value={formData.agrement_promoteur}
                  onChange={(e) => handleChange('agrement_promoteur', e.target.value)}
                  placeholder="Ex: AGR-MIN-HABITAT-2021-0487"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date d'Octroi de l'Agrément
                </label>
                <input
                  type="date"
                  value={formData.date_agrement || ''}
                  onChange={(e) => handleChange('date_agrement', e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capital Social en Dinars (DA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.capital_social}
                    onChange={(e) => handleChange('capital_social', e.target.value)}
                    className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">DA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  N° Registre de Commerce (RC)
                </label>
                <input
                  type="text"
                  value={formData.registre_commerce}
                  onChange={(e) => handleChange('registre_commerce', e.target.value)}
                  placeholder="Ex: 16/00-0987654B21"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro d'Identification Fiscale (NIF)
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => handleChange('nif', e.target.value)}
                  placeholder="Ex: 002116010987654"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro Statistique (NIS)
                </label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => handleChange('nis', e.target.value)}
                  placeholder="Ex: 098765432101234"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Article d'Imposition (AI)
                </label>
                <input
                  type="text"
                  value={formData.article_imposition}
                  onChange={(e) => handleChange('article_imposition', e.target.value)}
                  placeholder="Ex: 16010987654"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Address & Contact */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Siège Social & Coordonnées
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse Complète du Siège *
                  </label>
                  <input
                    type="text"
                    value={formData.adresse_siege}
                    onChange={(e) => handleChange('adresse_siege', e.target.value)}
                    placeholder="Ex: 14, Boulevard du 11 Décembre 1960"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Commune</label>
                  <input
                    type="text"
                    value={formData.commune}
                    onChange={(e) => handleChange('commune', e.target.value)}
                    placeholder="Hydra"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Wilaya</label>
                  <input
                    type="text"
                    value={formData.wilaya}
                    onChange={(e) => handleChange('wilaya', e.target.value)}
                    placeholder="Alger"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone Principal</label>
                  <input
                    type="text"
                    value={formData.telephone_1}
                    onChange={(e) => handleChange('telephone_1', e.target.value)}
                    placeholder="+213 (0) 23 45 67 89"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone Mobile</label>
                  <input
                    type="text"
                    value={formData.telephone_2}
                    onChange={(e) => handleChange('telephone_2', e.target.value)}
                    placeholder="+213 (0) 550 12 34 56"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Contact</label>
                  <input
                    type="email"
                    value={formData.email_contact}
                    onChange={(e) => handleChange('email_contact', e.target.value)}
                    placeholder="contact@batipromo.dz"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site Web</label>
                  <input
                    type="url"
                    value={formData.site_web}
                    onChange={(e) => handleChange('site_web', e.target.value)}
                    placeholder="https://www.batipromo.dz"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Banking Coordinates */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Coordonnées Bancaires Principales (Pour Versements Acquéreurs)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banque & Agence Principale
                  </label>
                  <input
                    type="text"
                    value={formData.banque_principale}
                    onChange={(e) => handleChange('banque_principale', e.target.value)}
                    placeholder="Ex: Banque Nationale d'Algérie (BNA) - Agence Didouche Mourad"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relevé d'Identité Bancaire (RIB - 20 Chiffres)
                  </label>
                  <input
                    type="text"
                    value={formData.rib_principal}
                    onChange={(e) => handleChange('rib_principal', e.target.value)}
                    placeholder="001 00234 0300012345 67"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TRÉSORERIE & CONTRÔLE DES SORTIES                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'caisses' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Règles de Contrôle de Trésorerie & Sorties de Caisse</h2>
            <p className="text-xs text-slate-500">
              Paramétrez les conditions de validation par l'Administrateur / Direction Générale
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-bold text-xs text-amber-950 block">
                  Exiger la validation obligatoire de la Direction pour TOUTES les sorties de caisse
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Lorsque cette option est activée, toute sortie créée par un non-administrateur (conducteur, caissier) reste en statut « En Attente de Validation ». La caisse n'est débitée qu'après l'approbation formelle de l'Admin.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={Boolean(formData.exiger_validation_toutes_sorties)}
                  onChange={(e) => handleChange('exiger_validation_toutes_sorties', e.target.checked ? 1 : 0)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seuil de Sortie Sensible Requérant Validation (si mode seuil)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.seuil_validation_caisse}
                    onChange={(e) => handleChange('seuil_validation_caisse', e.target.value)}
                    className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">DA</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Les montants supérieurs à cette valeur déclenchent une notification prioritaire.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seuil d'Alerte Bas par Défaut des Caisses de Chantier
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.seuil_alerte_caisse_defaut}
                    onChange={(e) => handleChange('seuil_alerte_caisse_defaut', e.target.value)}
                    className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">DA</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Déclenche l'alerte de réapprovisionnement automatique sur le tableau de bord.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Devise Principale Active :</span>
                <strong className="text-slate-900 font-mono text-sm">{formData.devise_nom} ({formData.devise_symbole})</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Code ISO :</span>
                <strong className="text-slate-900 font-mono text-sm">{formData.devise_code}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Norme Comptable :</span>
                <strong className="text-emerald-700 font-semibold">Système Comptable Financier (SCF Algérie)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: RH & PARAMÈTRES PAIE                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'rh' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Paramètres de Gestion du Personnel & Calcul de Paie</h2>
            <p className="text-xs text-slate-500">
              Barèmes officiels de cotisations sociales CNAS et bases de temps de travail sur chantiers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taux CNAS Ouvrier / Salarié (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.taux_cnas_salarie}
                  onChange={(e) => handleChange('taux_cnas_salarie', e.target.value)}
                  className="w-full text-xs p-2.5 pr-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Retenue légale CNAS ouvrier (9%)</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taux CNAS Patronal (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.taux_cnas_patronal}
                  onChange={(e) => handleChange('taux_cnas_patronal', e.target.value)}
                  className="w-full text-xs p-2.5 pr-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Quote-part employeur (26%)</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Heures Normales / Jour
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={formData.heures_jour_travail}
                  onChange={(e) => handleChange('heures_jour_travail', e.target.value)}
                  className="w-full text-xs p-2.5 pr-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">h</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Base journalière de pointage (8h)</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jours Ouvrables / Mois
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.jours_ouvrables_mois}
                  onChange={(e) => handleChange('jours_ouvrables_mois', e.target.value)}
                  className="w-full text-xs p-2.5 pr-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">j</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Base mensuelle standard (22j)</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: DOCUMENTS & MENTIONS LÉGALES                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Mentions Légales & Textes Officiels</h2>
            <p className="text-xs text-slate-500">
              Textes apparaissant automatiquement sur les bons de décaissement, fiches de paie et contrats
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mention de Sécurité / Confidentialité sur les Bons de Caisse
              </label>
              <textarea
                rows={2}
                value={formData.mention_legale_documents}
                onChange={(e) => handleChange('mention_legale_documents', e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 leading-relaxed"
              ></textarea>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Texte centré en bas des bons de décaissement et reçus officiels.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pied de Page Officiel (Raison Sociale, Capital, Agrément, NIF)
              </label>
              <textarea
                rows={2}
                value={formData.pied_de_page_documents}
                onChange={(e) => handleChange('pied_de_page_documents', e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono text-[11px]"
              ></textarea>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pied de page institutionnel figurant sur les devis, factures et documents GED exportés.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: SAUVEGARDE & SYSTÈME                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sauvegarde & Santé du Système</h2>
            <p className="text-xs text-slate-500">
              Téléchargez une copie de sécurité intégrale de la base de données SQLite de votre entreprise
            </p>
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Sauvegarde Complète de la Base SQLite</h3>
                <p className="text-xs text-slate-400">
                  Comprend l'ensemble des chantiers, caisses, écritures comptables, paies, tiers et documents.
                </p>
              </div>
            </div>

            <a
              href={`/api/settings/backup?token=${encodeURIComponent(localStorage.getItem('batipromo_token') || '')}`}
              download
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-900/40 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Sauvegarde (.db)</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block">Moteur de Base de Données :</span>
              <strong className="text-slate-900 font-mono text-sm">SQLite Native (node:sqlite)</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block">Intégrité & Sécurité :</span>
              <strong className="text-emerald-700 font-semibold">Transactions Atomiques WAL & FK Actives</strong>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-medium block">Dernière mise à jour :</span>
              <strong className="text-slate-700 font-mono text-xs">{new Date(formData.updated_at || Date.now()).toLocaleString('fr-FR')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom Save Action */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <span className="text-xs text-slate-500">
          Les modifications sont immédiatement répercutées sur toute l'application et les impressions.
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition"
        >
          {saving ? <span>Enregistrement...</span> : (
            <>
              <Save className="w-4 h-4" />
              <span>Enregistrer Tous les Paramètres</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
