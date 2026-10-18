const BASE_URL = '/api';

export function getAuthToken() {
  try {
    return localStorage.getItem('batipromo_token') || null;
  } catch {
    return null;
  }
}

export async function fetchJson(endpoint, options = {}) {
  try {
    const token = getAuthToken();
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {})
      },
      ...options
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Erreur serveur (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboardStats: () => fetchJson('/dashboard/stats'),
  getDashboardChantierStats: (chantierId) => fetchJson(`/dashboard/stats/${chantierId}`),

  // Chantiers
  getChantiers: () => fetchJson('/chantiers'),
  getChantierById: (id) => fetchJson(`/chantiers/${id}`),
  createChantier: (data) => fetchJson('/chantiers', { method: 'POST', body: JSON.stringify(data) }),
  updateChantier: (id, data) => fetchJson(`/chantiers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChantier: (id) => fetchJson(`/chantiers/${id}`, { method: 'DELETE' }),

  // Caisses & Trésorerie
  getCaisses: () => fetchJson('/caisses'),
  getCaisseById: (id) => fetchJson(`/caisses/${id}`),
  createCaisse: (data) => fetchJson('/caisses', { method: 'POST', body: JSON.stringify(data) }),
  getAllMouvements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/caisses/mouvements/all?${query}`);
  },
  getPendingMouvements: () => fetchJson('/caisses/mouvements/pending'),
  createMouvement: (data) => fetchJson('/caisses/mouvements', { method: 'POST', body: JSON.stringify(data) }),
  validateMouvement: (id, data = {}) => fetchJson(`/caisses/mouvements/${id}/validate`, { method: 'PUT', body: JSON.stringify(data) }),
  rejectMouvement: (id, data = {}) => fetchJson(`/caisses/mouvements/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dépenses
  getDepenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/depenses?${query}`);
  },
  createDepense: (data) => fetchJson('/depenses', { method: 'POST', body: JSON.stringify(data) }),
  reglerDepense: (id, data) => fetchJson(`/depenses/${id}/reglement`, { method: 'PUT', body: JSON.stringify(data) }),

  // Fournisseurs & Tiers
  getFournisseurs: () => fetchJson('/fournisseurs'),
  createFournisseur: (data) => fetchJson('/fournisseurs', { method: 'POST', body: JSON.stringify(data) }),
  getBeneficiaires: () => fetchJson('/fournisseurs/beneficiaires/list'),
  createBeneficiaire: (data) => fetchJson('/fournisseurs/beneficiaires', { method: 'POST', body: JSON.stringify(data) }),

  // Personnel & Paie
  getEmployees: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/personnel/employees?${query}`);
  },
  createEmployee: (data) => fetchJson('/personnel/employees', { method: 'POST', body: JSON.stringify(data) }),
  getAffectationsPersonnel: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/personnel/affectations?${query}`);
  },
  createAffectationPersonnel: (data) => fetchJson('/personnel/affectations', { method: 'POST', body: JSON.stringify(data) }),
  getPointages: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/personnel/pointages?${query}`);
  },
  savePointage: (data) => fetchJson('/personnel/pointages', { method: 'POST', body: JSON.stringify(data) }),
  getPaies: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/personnel/paies?${query}`);
  },
  generatePaies: (data) => fetchJson('/personnel/paies/generate', { method: 'POST', body: JSON.stringify(data) }),
  payerPaie: (id, data) => fetchJson(`/personnel/paies/${id}/payer`, { method: 'POST', body: JSON.stringify(data) }),

  // Matériel & Engins
  getMateriel: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/materiel?${query}`);
  },
  getMaterielById: (id) => fetchJson(`/materiel/${id}`),
  createMateriel: (data) => fetchJson('/materiel', { method: 'POST', body: JSON.stringify(data) }),
  getAffectationsMateriel: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/materiel/affectations/list?${query}`);
  },
  createAffectationMateriel: (data) => fetchJson('/materiel/affectations', { method: 'POST', body: JSON.stringify(data) }),
  libererMateriel: (id, data) => fetchJson(`/materiel/affectations/${id}/liberer`, { method: 'POST', body: JSON.stringify(data) }),
  getConsommations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/materiel/consommations/list?${query}`);
  },
  createConsommation: (data) => fetchJson('/materiel/consommations', { method: 'POST', body: JSON.stringify(data) }),

  // Stocks
  getArticles: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/stocks/articles?${query}`);
  },
  createArticle: (data) => fetchJson('/stocks/articles', { method: 'POST', body: JSON.stringify(data) }),
  getNiveauxStock: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/stocks/niveaux?${query}`);
  },
  getMouvementsStock: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/stocks/mouvements?${query}`);
  },
  createMouvementStock: (data) => fetchJson('/stocks/mouvements', { method: 'POST', body: JSON.stringify(data) }),

  // Clients & Ventes
  getClients: () => fetchJson('/clients'),
  createClient: (data) => fetchJson('/clients', { method: 'POST', body: JSON.stringify(data) }),
  getVentes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/clients/ventes/list?${query}`);
  },
  createVente: (data) => fetchJson('/clients/ventes', { method: 'POST', body: JSON.stringify(data) }),
  reglementVente: (id, data) => fetchJson(`/clients/ventes/${id}/reglement`, { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/documents?${query}`);
  },
  createDocument: (data) => fetchJson('/documents', { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: (id) => fetchJson(`/documents/${id}`, { method: 'DELETE' }),

  // Auth, Users & RBAC
  login: (email, password) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getUsers: () => fetchJson('/auth/users'),
  createUser: (data) => fetchJson('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => fetchJson(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  resetUserPassword: (id, password) => fetchJson(`/auth/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  deleteUser: (id) => fetchJson(`/auth/users/${id}`, { method: 'DELETE' }),

  getRoles: () => fetchJson('/auth/roles'),
  createRole: (data) => fetchJson('/auth/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRolePermissions: (id, data) => fetchJson(`/auth/roles/${id}/permissions`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id) => fetchJson(`/auth/roles/${id}`, { method: 'DELETE' }),

  getPermissionsCatalog: () => fetchJson('/auth/permissions'),
  switchUser: (userId) => fetchJson('/auth/switch-user', { method: 'POST', body: JSON.stringify({ userId }) }),
  getMe: () => fetchJson('/auth/me'),
  getAuditLogs: () => fetchJson('/auth/audit'),

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/notifications?${query}`);
  },
  markNotificationRead: (id) => fetchJson(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (userId) => fetchJson('/notifications/mark-all-read', { method: 'PUT', body: JSON.stringify({ user_id: userId }) }),
  deleteNotification: (id) => fetchJson(`/notifications/${id}`, { method: 'DELETE' }),

  // Paramètres & Promoteur
  getSettings: () => fetchJson('/settings'),
  updateSettings: (data) => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (formData) => {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch('/api/settings/upload-logo', { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors du téléversement du logo');
    }
    return await res.json();
  },
  uploadCachet: async (formData) => {
    const token = getAuthToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch('/api/settings/upload-cachet', { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors du téléversement du cachet');
    }
    return await res.json();
  },
  deleteLogo: () => fetchJson('/settings/logo', { method: 'DELETE' }),
  deleteCachet: () => fetchJson('/settings/cachet', { method: 'DELETE' }),

  // Planning & Jalons
  getPlanning: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/planning?${query}`);
  },
  createPlanningPhase: (data) => fetchJson('/planning', { method: 'POST', body: JSON.stringify(data) }),
  updatePlanningPhase: (id, data) => fetchJson(`/planning/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlanningPhase: (id) => fetchJson(`/planning/${id}`, { method: 'DELETE' }),

  // Rapports & États Financiers
  getBilanTresorerie: () => fetchJson('/reports/bilan-tresorerie'),
  getGrandLivreDepenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson(`/reports/grand-livre-depenses?${query}`);
  }
};
