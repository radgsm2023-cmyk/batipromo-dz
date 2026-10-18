import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Wallet, 
  HardHat, 
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { getRoleBadge } from '../utils/formatters';

export default function LoginView({ onLoginSuccess, companySettings }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-configured test accounts for quick demo testing
  const testAccounts = [
    {
      name: 'M. Karim Brahimi',
      role: 'ADMIN',
      roleLabel: 'Directeur Général / Promoteur',
      email: 'admin@batipromo.dz',
      password: 'promo2026',
      scope: 'Accès Total Consolidé (Tous Chantiers & Finances)',
      color: 'bg-slate-900 text-white border-slate-700',
      iconColor: 'text-amber-400'
    },
    {
      name: 'Ing. Amine Dahmani',
      role: 'CONDUCTEUR',
      roleLabel: 'Conducteur de Travaux Principal',
      email: 'conducteur@batipromo.dz',
      password: 'promo2026',
      scope: 'Chantiers Hydra Alger & Front de Mer Oran',
      color: 'bg-blue-900 text-blue-100 border-blue-700',
      iconColor: 'text-blue-400'
    },
    {
      name: 'Mme. Samia Benali',
      role: 'CAISSIER',
      roleLabel: 'Responsable Trésorerie & Caisses',
      email: 'caisse@batipromo.dz',
      password: 'promo2026',
      scope: 'Caisses Fond de Roulement & Banques (BNA, CPA)',
      color: 'bg-emerald-900 text-emerald-100 border-emerald-700',
      iconColor: 'text-emerald-400'
    },
    {
      name: 'M. Yacine Mebarki',
      role: 'COMPTABLE',
      roleLabel: 'Chef Comptable',
      email: 'comptable@batipromo.dz',
      password: 'promo2026',
      scope: 'Dépenses, Factures, Règlements & Paies',
      color: 'bg-indigo-900 text-indigo-100 border-indigo-700',
      iconColor: 'text-indigo-400'
    },
    {
      name: 'Mme. Leila Cherif',
      role: 'RH',
      roleLabel: 'Responsable RH & Paie',
      email: 'rh@batipromo.dz',
      password: 'promo2026',
      scope: 'Salariés, Ouvriers Tâcherons & Pointages',
      color: 'bg-purple-900 text-purple-100 border-purple-700',
      iconColor: 'text-purple-400'
    },
    {
      name: 'M. Omar Bouzid',
      role: 'MAGASINIER',
      roleLabel: 'Gestionnaire Stocks & Matériel',
      email: 'magasin@batipromo.dz',
      password: 'promo2026',
      scope: 'Bons Réception BL, Parc Engins & Carburant',
      color: 'bg-amber-950 text-amber-100 border-amber-800',
      iconColor: 'text-amber-400'
    },
    {
      name: 'Ing. Mourad Khelifi',
      role: 'CONDUCTEUR',
      roleLabel: 'Conducteur Chantier Annaba',
      email: 'mourad@batipromo.dz',
      password: 'password123',
      scope: 'Restreint uniquement à : Résidence Bella Vista Annaba',
      color: 'bg-teal-900 text-teal-100 border-teal-700',
      iconColor: 'text-teal-400'
    }
  ];

  const handleLogin = async (e, directEmail, directPassword) => {
    if (e) e.preventDefault();
    const loginEmail = directEmail || email;
    const loginPassword = directPassword || password;

    if (!loginEmail || !loginPassword) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.login(loginEmail, loginPassword);
      if (response && response.user) {
        localStorage.setItem('batipromo_user', JSON.stringify(response.user));
        localStorage.setItem('batipromo_token', response.token);
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTestLogin = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    handleLogin(null, acc.email, acc.password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Background ambient decorative glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand & Product Overview (5 cols) */}
        <div className="lg:col-span-5 text-white space-y-6">
          <div className="flex items-center gap-3">
            {companySettings?.logo_url ? (
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-lg border border-slate-700 overflow-hidden">
                <img 
                  src={companySettings.logo_url} 
                  alt="Logo Promoteur" 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  {companySettings?.sigle || companySettings?.company_name || 'BATIPROMO'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-600 text-white tracking-widest">DZ</span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[280px]">
                {companySettings?.company_name || 'ERP Promotion Immobilière & Multi-Chantiers'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 leading-tight">
              Plateforme Intégrée de Gestion pour Promoteurs Immobiliers
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Centralisation complète des chantiers en Algérie, des caisses de fond de roulement en Dinars Algériens (DA), du parc engins, des pointages ouvriers, de la paie et de la GED.
            </p>
          </div>

          {/* Key Value Badges */}
          <div className="space-y-2.5 pt-2 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Fonds de Roulement & Bons de Caisse</span>
                <span className="text-[11px] text-slate-400">Alimentations, décaissements et reçus en Dinars Algériens (DA)</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Personnel, Pointage & Bulletins de Paie</span>
                <span className="text-[11px] text-slate-400">Salariés permanents et tâcherons avec affectation chantier</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-200 block">Engins Lourds (Interne & Location)</span>
                <span className="text-[11px] text-slate-400">Affectations, compteurs horaires, carburant gasoil et maintenance</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité RBAC avec restriction de périmètre par chantier</span>
          </div>
        </div>

        {/* Right Side: Form + Test Accounts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Login Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Authentification</h2>
              <p className="text-xs text-slate-400 mt-1">
                Entrez vos identifiants ou utilisez les comptes de test rapides ci-dessous
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Adresse Email Professionnelle</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="nom@batipromo.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mot de Passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Connexion en cours...</span>
                ) : (
                  <>
                    <span>Se Connecter au Système</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Test Accounts Grid (Requested by User) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Comptes de Test Immédiats (1 Clic)
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Mot de passe démo: promo2026</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Cliquez sur n'importe quel profil ci-dessous pour vous connecter instantanément et tester ses droits et son périmètre :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {testAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickTestLogin(acc)}
                  className="text-left p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500 hover:bg-slate-900/90 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <div className="truncate">
                      <div className="font-bold text-xs text-white group-hover:text-blue-400 transition truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {acc.roleLabel}
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold font-mono uppercase shrink-0 bg-blue-950 text-blue-300 border border-blue-800">
                      {acc.role}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate mb-2">
                    {acc.scope}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-900 text-slate-400 group-hover:text-blue-400">
                    <span className="font-mono text-[9px]">{acc.email}</span>
                    <span className="font-bold flex items-center gap-1">
                      Connexion <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
