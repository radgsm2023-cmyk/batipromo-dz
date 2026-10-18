import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ChantiersView from './views/ChantiersView';
import ChantierDetailView from './views/ChantierDetailView';
import CaissesView from './views/CaissesView';
import PersonnelView from './views/PersonnelView';
import MaterielView from './views/MaterielView';
import StocksView from './views/StocksView';
import DepensesView from './views/DepensesView';
import ClientsView from './views/ClientsView';
import DocumentsView from './views/DocumentsView';
import UsersView from './views/UsersView';
import AuditView from './views/AuditView';
import SettingsView from './views/SettingsView';
import PlanningView from './views/PlanningView';
import ReportsView from './views/ReportsView';
import { 
  LayoutDashboard, 
  Building, 
  Wallet, 
  CalendarDays, 
  Menu 
} from 'lucide-react';

import PrintBonCaisseModal from './components/PrintBonCaisseModal';
import PrintBulletinPaieModal from './components/PrintBulletinPaieModal';
import NewMouvementModal from './components/NewMouvementModal';
import NewChantierModal from './components/NewChantierModal';

import { api } from './services/api';

export default function App() {
  // ──────────────────────────────────────────────────────────────────────────
  // Authentication state — persisted in localStorage
  // ──────────────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('batipromo_user');
      return !!saved;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('batipromo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Navigation state
  // ──────────────────────────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedChantierId, setSelectedChantierId] = useState(null);
  const [selectedChantierFilter, setSelectedChantierFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global data
  const [users, setUsers] = useState([]);
  const [chantiers, setChantiers] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);

  // Modals state
  const [printBonData, setPrintBonData] = useState(null);
  const [printPaieData, setPrintPaieData] = useState(null);
  const [showNewMouvement, setShowNewMouvement] = useState(false);
  const [preselectedCaisseId, setPreselectedCaisseId] = useState(null);
  const [showNewChantier, setShowNewChantier] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // Auth handlers
  // ──────────────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Reset view to dashboard on fresh login
    setCurrentView('dashboard');
    setSelectedChantierId(null);
    setSelectedChantierFilter('');
  };

  const handleLogout = () => {
    localStorage.removeItem('batipromo_user');
    localStorage.removeItem('batipromo_token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedChantierId(null);
    setUsers([]);
    setChantiers([]);
    setCaisses([]);
    setEmployees([]);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Data loading — only when authenticated
  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  // Data loading
  // ──────────────────────────────────────────────────────────────────────────
  const loadCompanySettings = async () => {
    try {
      const settings = await api.getSettings();
      if (settings) setCompanySettings(settings);
    } catch (e) {
      console.error('Erreur chargement paramètres:', e);
    }
  };

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadInitialData = async () => {
    try {
      const [uList, cList, caissesList, empList, settings] = await Promise.all([
        api.getUsers(),
        api.getChantiers(),
        api.getCaisses(),
        api.getEmployees(),
        api.getSettings().catch(() => null)
      ]);
      setUsers(uList);
      setChantiers(cList);
      setCaisses(caissesList);
      setEmployees(empList);
      if (settings) setCompanySettings(settings);
    } catch (e) {
      console.error('Erreur chargement données initiales:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // ──────────────────────────────────────────────────────────────────────────
  // User switching (demo mode via dropdown Navbar)
  // ──────────────────────────────────────────────────────────────────────────
  const handleSwitchUser = async (userId) => {
    try {
      const res = await api.switchUser(userId);
      const updatedUser = res.user;
      setCurrentUser(updatedUser);
      // Persist the switched user in localStorage
      localStorage.setItem('batipromo_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Erreur changement utilisateur:', e);
    }
  };

  const handleSelectChantier = (id) => {
    setSelectedChantierId(id);
    setCurrentView('chantier-detail');
  };

  const handleOpenNewMouvement = (caisseId = null) => {
    setPreselectedCaisseId(caisseId);
    setShowNewMouvement(true);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN — shown before any authenticated content
  // ──────────────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} companySettings={companySettings} />;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MAIN APPLICATION SHELL
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ── Top Navbar ── */}
      <Navbar
        currentUser={currentUser}
        users={users}
        companySettings={companySettings}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        chantiers={chantiers}
        selectedChantierFilter={selectedChantierFilter}
        onSelectChantierFilter={(val) => {
          setSelectedChantierFilter(val);
          if (val) {
            handleSelectChantier(val);
          } else {
            setCurrentView('dashboard');
            setSelectedChantierId(null);
          }
        }}
        onOpenNewMouvement={() => handleOpenNewMouvement()}
        onOpenNewChantier={() => setShowNewChantier(true)}
        onNavigate={(v) => {
          setCurrentView(v);
          setSelectedChantierId(null);
        }}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
      />

      {/* ── Main Body: Sidebar + Active View ── */}
      <div className="flex-1 flex flex-row w-full">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView === 'chantier-detail' ? 'chantiers' : currentView}
          onSelectView={(viewId) => {
            setCurrentView(viewId);
            setSelectedChantierId(null);
          }}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* View Content Area with Mobile Padding Bottom */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-20 lg:pb-8">
          {currentView === 'dashboard' && (
            <DashboardView
              chantiers={chantiers}
              onSelectChantier={handleSelectChantier}
              onOpenPrintBon={(mvt) => setPrintBonData(mvt)}
              onNavigate={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'chantiers' && (
            <ChantiersView
              onSelectChantier={handleSelectChantier}
              onOpenNewChantier={() => setShowNewChantier(true)}
            />
          )}

          {currentView === 'chantier-detail' && (
            <ChantierDetailView
              chantierId={selectedChantierId}
              onBack={() => setCurrentView('chantiers')}
              onOpenPrintBon={(mvt) => setPrintBonData(mvt)}
              onOpenNewMouvement={(cid) => handleOpenNewMouvement(cid)}
            />
          )}

          {currentView === 'caisses' && (
            <CaissesView
              currentUser={currentUser}
              onOpenNewMouvement={(cid) => handleOpenNewMouvement(cid)}
              onOpenPrintBon={(mvt) => setPrintBonData(mvt)}
            />
          )}

          {currentView === 'personnel' && (
            <PersonnelView
              chantiers={chantiers}
              caisses={caisses}
              onOpenPrintPaie={(paie) => setPrintPaieData(paie)}
            />
          )}

          {currentView === 'materiel' && (
            <MaterielView
              chantiers={chantiers}
              caisses={caisses}
              employees={employees}
            />
          )}

          {currentView === 'stocks' && (
            <StocksView
              chantiers={chantiers}
            />
          )}

          {currentView === 'depenses' && (
            <DepensesView
              chantiers={chantiers}
              caisses={caisses}
            />
          )}

          {currentView === 'clients' && (
            <ClientsView
              chantiers={chantiers}
              caisses={caisses}
            />
          )}

          {currentView === 'documents' && (
            <DocumentsView
              chantiers={chantiers}
            />
          )}

          {currentView === 'users' && (
            <UsersView
              chantiers={chantiers}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {currentView === 'audit' && (
            <AuditView />
          )}

          {currentView === 'planning' && (
            <PlanningView
              chantiers={chantiers}
              onSelectChantier={handleSelectChantier}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              companySettings={companySettings}
              chantiers={chantiers}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView 
              currentUser={currentUser} 
              onSettingsUpdated={(updated) => setCompanySettings(updated)} 
            />
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (PWA Phone Experience) ── */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md flex items-center justify-around py-1.5 px-2 text-[10px] shadow-2xl">
        <button
          onClick={() => { setCurrentView('dashboard'); setSelectedChantierId(null); }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            currentView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => { setCurrentView('chantiers'); setSelectedChantierId(null); }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            currentView === 'chantiers' || currentView === 'chantier-detail' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-5 h-5 mb-0.5" />
          <span>Chantiers</span>
        </button>

        <button
          onClick={() => { setCurrentView('planning'); setSelectedChantierId(null); }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            currentView === 'planning' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-5 h-5 mb-0.5" />
          <span>Planning</span>
        </button>

        <button
          onClick={() => { setCurrentView('caisses'); setSelectedChantierId(null); }}
          className={`flex flex-col items-center py-1 px-2 rounded-lg transition ${
            currentView === 'caisses' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span>Caisses</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center py-1 px-2 rounded-lg text-slate-400 hover:text-white transition"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Modules</span>
        </button>
      </nav>

      {/* ── Global Modals ── */}
      {printBonData && (
        <PrintBonCaisseModal
          mouvement={printBonData}
          companySettings={companySettings}
          onClose={() => setPrintBonData(null)}
        />
      )}

      {printPaieData && (
        <PrintBulletinPaieModal
          paie={printPaieData}
          companySettings={companySettings}
          onClose={() => setPrintPaieData(null)}
        />
      )}

      {showNewMouvement && (
        <NewMouvementModal
          currentUser={currentUser}
          caisses={caisses}
          chantiers={chantiers}
          preselectedCaisseId={preselectedCaisseId}
          onClose={() => setShowNewMouvement(false)}
          onSuccess={() => loadInitialData()}
        />
      )}

      {showNewChantier && (
        <NewChantierModal
          users={users}
          onClose={() => setShowNewChantier(false)}
          onSuccess={() => {
            loadInitialData();
            setCurrentView('chantiers');
          }}
        />
      )}
    </div>
  );
}
