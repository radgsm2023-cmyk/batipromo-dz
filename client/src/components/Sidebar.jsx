import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Wallet, 
  Users, 
  Truck, 
  Package, 
  Receipt, 
  FileCheck2, 
  FolderLock, 
  ShieldAlert,
  Sliders,
  CalendarDays,
  FileSpreadsheet,
  X
} from 'lucide-react';

export default function Sidebar({ currentView, onSelectView, isOpenMobile, onCloseMobile }) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, badge: 'Live' },
    { id: 'chantiers', label: 'Chantiers Immobiliers', icon: Building, badge: null },
    { id: 'planning', label: 'Planning & Jalons', icon: CalendarDays, sublabel: 'Phases, Délais & Gantt', highlight: true },
    { id: 'caisses', label: 'Caisses & Fonds de R.', icon: Wallet, highlight: true },
    { id: 'reports', label: 'Rapports & Bilans', icon: FileSpreadsheet, sublabel: 'États Financiers Imprimables' },
    { id: 'personnel', label: 'Personnel & Paie', icon: Users, sublabel: 'Affectations & Pointage' },
    { id: 'materiel', label: 'Matériel & Engins', icon: Truck, sublabel: 'Interne & Location' },
    { id: 'stocks', label: 'Stocks & Matériaux', icon: Package, badge: null },
    { id: 'depenses', label: 'Dépenses & Tiers', icon: Receipt, badge: null },
    { id: 'clients', label: 'Clients & Ventes', icon: FileCheck2, badge: null },
    { id: 'documents', label: 'Documents & GED', icon: FolderLock, badge: null },
    { id: 'users', label: 'Utilisateurs & RBAC', icon: Users, sublabel: 'Rôles & Permissions' },
    { id: 'settings', label: 'Paramétrage & Promoteur', icon: Sliders, sublabel: 'Logo, Agrément & Coordonnées' },
    { id: 'audit', label: 'Journal d\'Audit', icon: ShieldAlert, badge: null },
  ];

  const handleSelect = (id) => {
    onSelectView(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Mobile Drawer Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
        <div>
          <span className="text-xs font-black text-white uppercase tracking-wider">Navigation ERP</span>
          <p className="text-[10px] text-slate-400">BATIPROMO DZ Mobile</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          aria-label="Fermer le menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4">
        Modules Métier
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'hover:bg-slate-800/90 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <div className="text-left truncate">
                  <div className="truncate">{item.label}</div>
                  {item.sublabel && (
                    <div className={`text-[10px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {item.sublabel}
                    </div>
                  )}
                </div>
              </div>

              {item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 m-2 rounded-xl text-[11px]">
        <div className="flex items-center justify-between font-bold text-slate-200 mb-1">
          <span>Devise Active</span>
          <span className="text-emerald-400 font-mono">DZD / DA</span>
        </div>
        <p className="text-slate-500 text-[10px] leading-relaxed">
          Promotion immobilière multi-chantiers en Algérie.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Permanent Sidebar ── */}
      <aside className="no-print hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col shrink-0 min-h-[calc(100vh-57px)]">
        {navContent}
      </aside>

      {/* ── Mobile Slide-Over Drawer with Backdrop ── */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Dark backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
