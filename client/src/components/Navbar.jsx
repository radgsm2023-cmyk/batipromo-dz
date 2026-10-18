import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  PlusCircle, 
  DollarSign, 
  ChevronDown, 
  HardHat,
  Coins,
  LogOut,
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Menu
} from 'lucide-react';
import { api } from '../services/api';
import { getRoleBadge, formatDA, formatDate } from '../utils/formatters';

export default function Navbar({ 
  currentUser, 
  users = [], 
  companySettings,
  onSwitchUser, 
  onLogout,
  chantiers = [], 
  selectedChantierFilter, 
  onSelectChantierFilter, 
  onOpenNewMouvement,
  onOpenNewChantier,
  onNavigate,
  onToggleMobileMenu
}) {
  const roleBadge = getRoleBadge(currentUser?.role || 'ADMIN');

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications({ 
        user_id: currentUser?.id, 
        limit: 20 
      });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 12000); // 12s polling
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser?.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    setShowNotifications(false);
    if (n.lien && onNavigate) {
      onNavigate(n.lien);
    }
  };

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Drawer Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition focus:outline-none"
          title="Menu des modules"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {companySettings?.logo_url ? (
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700 overflow-hidden">
            <img 
              src={companySettings.logo_url} 
              alt="Logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white shadow-inner shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-base text-white">
              {companySettings?.sigle || companySettings?.company_name || 'BATIPROMO'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white tracking-wider">DZ</span>
          </div>
          <p className="text-[10px] text-slate-400 -mt-0.5 font-medium truncate max-w-[240px]">
            {companySettings?.company_name 
              ? `${companySettings.forme_juridique || ''} Promotion Immobilière` 
              : 'ERP Promotion Immobilière & Multi-Chantiers'}
          </p>
        </div>
      </div>

      {/* Center: Global Chantier Filter & Currency Badge */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/80 text-xs">
          <HardHat className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400 font-medium">Filtre Chantier :</span>
          <select
            value={selectedChantierFilter || ''}
            onChange={(e) => onSelectChantierFilter(e.target.value)}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-white">Tous les Chantiers (Vue Consolidée)</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                {c.code} - {c.name} ({c.wilaya})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-mono font-medium">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span>Devise : Dinar Algérien (DA)</span>
        </div>
      </div>

      {/* Right: Quick Actions, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={onOpenNewMouvement}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          title="Nouveau décaissement / bon de caisse"
        >
          <DollarSign className="w-4 h-4" />
          <span className="hidden sm:inline">Mouvement Caisse</span>
        </button>

        <button
          onClick={onOpenNewChantier}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Chantier</span>
        </button>

        {/* ── NOTIFICATIONS BELL WITH DROPDOWN ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) loadNotifications();
            }}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Notifications & Versements reçus"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs backdrop-blur-xl">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Notifications & Alertes</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tout marquer lu</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isVersement = n.type === 'VERSEMENT_BENEFICIAIRE' || n.type === 'VERSEMENT_CLIENT';
                    const isDemandeValidation = n.type === 'VALIDATION_CAISSE_REQUISE';
                    const isValidee = n.type === 'OPERATION_VALIDEE';
                    const isRejetee = n.type === 'OPERATION_REJETEE';

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 hover:bg-slate-800/60 cursor-pointer transition flex items-start gap-3 ${
                          !n.is_read ? 'bg-slate-800/30' : ''
                        }`}
                      >
                        {/* Icon type */}
                        <div className="mt-0.5 shrink-0">
                          {isVersement && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                          )}
                          {isDemandeValidation && (
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                          {isValidee && (
                            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          {isRejetee && (
                            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                              <ArrowDownRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`font-bold text-xs truncate ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                              {n.titre}
                            </span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-snug break-words">
                            {n.message}
                          </p>

                          {n.montant > 0 && (
                            <div className="mt-1 font-mono font-bold text-xs text-emerald-400">
                              {formatDA(n.montant)}
                            </div>
                          )}

                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{new Date(n.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {n.lien && (
                              <span className="text-blue-400 font-semibold flex items-center gap-0.5">
                                Voir détails <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── User Role Switcher Dropdown ── */}
        <div className="relative group">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer transition">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-200 leading-tight max-w-[130px] truncate">
                {currentUser?.name || 'Administrateur'}
              </div>
              <div className="flex items-center gap-1">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Role Switching Menu */}
          <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 hidden group-hover:block z-50 text-xs">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              Changer de Profil (Démo & Rôles)
            </div>
            {users.map((u) => {
              const b = getRoleBadge(u.role);
              const isActive = u.id === currentUser?.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u.id)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition ${isActive ? 'bg-slate-800/80 font-bold text-blue-400' : 'text-slate-300'}`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate text-xs">{u.name}</p>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${b.bg} shrink-0`}>
                    {b.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Logout Button ── */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Se déconnecter"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/40 hover:bg-rose-700 border border-rose-800 hover:border-rose-600 text-rose-300 hover:text-white text-xs font-semibold rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        )}
      </div>
    </header>
  );
}
