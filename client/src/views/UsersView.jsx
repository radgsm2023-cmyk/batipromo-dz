import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Building, 
  Lock, 
  Unlock, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Sliders,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate, getRoleBadge } from '../utils/formatters';

export default function UsersView({ chantiers = [], currentUser, onSwitchUser }) {
  const [subTab, setSubTab] = useState('users'); // 'users', 'roles', 'matrix'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState({ all: [], grouped: {} });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for create, obj for edit
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRolePermissions, setEditingRolePermissions] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(null); // user obj

  // Form states
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    phone: '',
    status: 'ACTIF',
    assigned_chantiers: []
  });

  const [roleForm, setRoleForm] = useState({
    code: '',
    name: '',
    description: '',
    permissions: []
  });

  const [newPassword, setNewPassword] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, rData, pData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPermissionsCatalog()
      ]);
      setUsers(uData);
      setRoles(rData);
      setPermissionsCatalog(pData);
    } catch (e) {
      console.error('Error loading users/roles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      password: '',
      role_id: roles[0]?.id || '',
      phone: '',
      status: 'ACTIF',
      assigned_chantiers: []
    });
    setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      password: '', // blank unless changing
      role_id: u.role_id,
      phone: u.phone || '',
      status: u.status || 'ACTIF',
      assigned_chantiers: u.assignedChantiers?.map(c => c.id) || []
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, userForm);
        if (userForm.password) {
          await api.resetUserPassword(editingUser.id, userForm.password);
        }
      } else {
        await api.createUser(userForm);
      }
      setShowUserModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'enregistrement de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Supprimer définitivement le compte utilisateur de ${userName} ?`)) return;
    try {
      await api.deleteUser(userId);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur suppression utilisateur');
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      await api.createRole(roleForm);
      setShowRoleModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur création rôle');
    }
  };

  const handleUpdateRolePermissions = async (roleId, updatedPermissions) => {
    try {
      await api.updateRolePermissions(roleId, { permissions: updatedPermissions });
      loadData();
    } catch (err) {
      alert(err.message || 'Erreur mise à jour permissions');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!showPasswordModal || !newPassword) return;
    try {
      await api.resetUserPassword(showPasswordModal.id, newPassword);
      setShowPasswordModal(null);
      setNewPassword('');
      alert('Mot de passe mis à jour avec succès.');
    } catch (err) {
      alert(err.message || 'Erreur réinitialisation mot de passe');
    }
  };

  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Utilisateurs & Permissions (RBAC)</h1>
          <p className="text-xs text-slate-500">
            Contrôle d'accès basé sur les rôles, permissions granulaires par module et restriction du périmètre par chantier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRoleForm({
                code: '',
                name: '',
                description: '',
                permissions: []
              });
              setShowRoleModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Shield className="w-4 h-4" />
            Nouveau Rôle
          </button>
          <button
            onClick={openCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-4 h-4" />
            Utilisateurs & Périmètres ({users.length})
          </button>
          <button
            onClick={() => setSubTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'roles' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            Rôles Définis ({roles.length})
          </button>
          <button
            onClick={() => setSubTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Sliders className="w-4 h-4" />
            Matrice Globale des Permissions ({permissionsCatalog.all.length})
          </button>
        </div>

        {subTab === 'users' && (
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* SUB-VIEW 1: USERS LIST */}
      {subTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center">
            <span>Comptes Utilisateurs & Périmètres d'Intervention</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Utilisateur Actuel : <strong className="text-blue-600 font-semibold">{currentUser?.name}</strong>
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Utilisateur</th>
                <th className="py-2.5 px-3">Rôle & Droits</th>
                <th className="py-2.5 px-3">Périmètre Chantiers</th>
                <th className="py-2.5 px-3">Téléphone</th>
                <th className="py-2.5 px-3 text-center">Permissions</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredUsers.map((u) => {
                const badge = getRoleBadge(u.role);
                const isCurrent = currentUser?.id === u.id;
                const isBlocked = u.status === 'BLOQUE';

                return (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-blue-50/40' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-600 text-white font-extrabold">VOUS</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg}`}>
                        {u.role_name || badge.label}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {u.role === 'ADMIN' || !u.assignedChantiers || u.assignedChantiers.length === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tous les Chantiers (Global)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.assignedChantiers.map(c => (
                            <span key={c.id} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold font-mono">
                              {c.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">{u.phone || '-'}</td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-800">
                        {u.permissionsCount} droits
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isBlocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isBlocked ? 'Bloqué' : 'Actif'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSwitchUser(u.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-[11px] font-semibold transition"
                          title="Tester l'application avec ce profil"
                        >
                          Incarner
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1 text-slate-500 hover:text-blue-600 rounded transition"
                          title="Modifier utilisateur et périmètre"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowPasswordModal(u)}
                          className="p-1 text-slate-500 hover:text-amber-600 rounded transition"
                          title="Changer mot de passe"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Supprimer compte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-VIEW 2: ROLES */}
      {subTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roles.map((r) => {
            const badge = getRoleBadge(r.code);
            const isSystem = r.is_system === 1;

            return (
              <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {r.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSystem ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isSystem ? 'Système' : 'Personnalisé'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{r.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 min-h-[36px]">
                    {r.description || 'Aucune description fournie.'}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 font-medium">Utilisateurs affectés :</span>
                      <strong className="text-slate-800">{r.users_count || 0} membres</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Droits accordés :</span>
                      <strong className="text-blue-700 font-bold">{r.permissions?.length || 0} permissions</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setEditingRolePermissions(r)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Configurer Permissions
                  </button>

                  {!isSystem && r.users_count === 0 && (
                    <button
                      onClick={async () => {
                        if (confirm(`Supprimer le rôle ${r.name} ?`)) {
                          await api.deleteRole(r.id);
                          loadData();
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-VIEW 3: GLOBAL PERMISSION MATRIX */}
      {subTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Matrice des Rôles & Permissions Granulaires
              </h2>
              <p className="text-[11px] text-slate-400">
                Cochez ou décochez les droits directement pour mettre à jour la politique de sécurité en temps réel.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-3 px-4 min-w-[280px]">Permission / Module</th>
                  {roles.map(r => (
                    <th key={r.id} className="py-3 px-3 text-center min-w-[120px]">
                      <div className="font-bold text-slate-900">{r.code}</div>
                      <div className="text-[10px] text-slate-500 font-normal truncate max-w-[110px] mx-auto">{r.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(permissionsCatalog.grouped).map(([modName, perms]) => (
                  <React.Fragment key={modName}>
                    {/* Module Header Row */}
                    <tr className="bg-slate-50/80 font-bold text-blue-900 border-t-2 border-slate-200">
                      <td colSpan={roles.length + 1} className="py-2 px-4 uppercase tracking-wider text-[11px] bg-slate-100/70">
                        Module : {modName} ({perms.length} actions)
                      </td>
                    </tr>

                    {/* Permissions rows */}
                    {perms.map(p => (
                      <tr key={p.key} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          <div className="font-semibold text-slate-900">{p.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.key}</div>
                        </td>
                        {roles.map(r => {
                          const hasPerm = r.permissions?.includes(p.key);
                          return (
                            <td key={r.id} className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={hasPerm || false}
                                onChange={() => {
                                  let newPerms;
                                  if (hasPerm) {
                                    newPerms = r.permissions.filter(k => k !== p.key);
                                  } else {
                                    newPerms = [...(r.permissions || []), p.key];
                                  }
                                  handleUpdateRolePermissions(r.id, newPerms);
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL USER (CREATE / EDIT) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {editingUser ? 'Modifier Utilisateur & Périmètre' : 'Créer un Nouvel Utilisateur'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nom Complet & Titre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ing. Nabil Chaouche"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Adresse Email de Connexion *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: nabil@batipromo.dz"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Mot de Passe Initial *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 caractères"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Téléphone de Contact</label>
                    <input
                      type="text"
                      placeholder="Ex: 0550 12 34 56"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className="w-full p-2 border rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Rôle Attribué *</label>
                  <select
                    required
                    value={userForm.role_id}
                    onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white font-semibold"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Statut du Compte</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="ACTIF">Actif (Accès autorisé)</option>
                    <option value="BLOQUE">Bloqué (Accès suspendu)</option>
                  </select>
                </div>
              </div>

              {/* Chantiers Scope Restriction */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">
                  Périmètre d'Affectation Chantier (Restriction de vue) :
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Si aucun chantier n'est coché, l'utilisateur a une vue consolidée globale sur tous les chantiers (recommandé pour Direction/Comptabilité).
                  Pour un conducteur ou chef de chantier, cochez uniquement ses chantiers affectés.
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {chantiers.map((c) => {
                    const isChecked = userForm.assigned_chantiers?.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-blue-50">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserForm({
                                ...userForm,
                                assigned_chantiers: [...userForm.assigned_chantiers, c.id]
                              });
                            } else {
                              setUserForm({
                                ...userForm,
                                assigned_chantiers: userForm.assigned_chantiers.filter(id => id !== c.id)
                              });
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="truncate font-medium">{c.code} - {c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                  {editingUser ? 'Enregistrer Modifications' : 'Créer Compte Utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT ROLE PERMISSIONS */}
      {editingRolePermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Permissions du Rôle : <span className="text-blue-600">{editingRolePermissions.name}</span> ({editingRolePermissions.code})
                </h3>
                <p className="text-xs text-slate-500">Cochez les droits accordés à ce rôle</p>
              </div>
              <button onClick={() => setEditingRolePermissions(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              {Object.entries(permissionsCatalog.grouped).map(([modName, perms]) => (
                <div key={modName} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex justify-between items-center">
                    <span>{modName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allModKeys = perms.map(p => p.key);
                        const hasAll = allModKeys.every(k => editingRolePermissions.permissions?.includes(k));
                        let newPerms;
                        if (hasAll) {
                          newPerms = editingRolePermissions.permissions.filter(k => !allModKeys.includes(k));
                        } else {
                          newPerms = Array.from(new Set([...(editingRolePermissions.permissions || []), ...allModKeys]));
                        }
                        setEditingRolePermissions({ ...editingRolePermissions, permissions: newPerms });
                      }}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      Tout (dé)sélectionner
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const isChecked = editingRolePermissions.permissions?.includes(p.key);
                      return (
                        <label key={p.key} className="flex items-start gap-2 p-1.5 bg-white rounded border border-slate-200 cursor-pointer hover:bg-blue-50/50">
                          <input
                            type="checkbox"
                            checked={isChecked || false}
                            onChange={(e) => {
                              let newPerms;
                              if (e.target.checked) {
                                newPerms = [...(editingRolePermissions.permissions || []), p.key];
                              } else {
                                newPerms = (editingRolePermissions.permissions || []).filter(k => k !== p.key);
                              }
                              setEditingRolePermissions({ ...editingRolePermissions, permissions: newPerms });
                            }}
                            className="mt-0.5 rounded text-blue-600"
                          />
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight">{p.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.key}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setEditingRolePermissions(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Fermer</button>
              <button
                onClick={async () => {
                  await handleUpdateRolePermissions(editingRolePermissions.id, editingRolePermissions.permissions);
                  setEditingRolePermissions(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Sauvegarder les Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Changer le Mot de Passe</h3>
            <p className="text-xs text-slate-600 mb-3">
              Utilisateur : <strong>{showPasswordModal.name}</strong> ({showPasswordModal.email})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nouveau Mot de Passe *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowPasswordModal(null)} className="px-3 py-1.5 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold">Valider Nouveau Mot de Passe</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREATE ROLE */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Créer un Rôle Personnalisé</h3>
            <form onSubmit={handleSaveRole} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Code du Rôle * (Identifiant court)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ASST_CONDUCTEUR ou AUDITEUR"
                  value={roleForm.code}
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                  className="w-full p-2 border rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Nom / Intitulé du Rôle *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Assistant Conducteur de Travaux"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description des Responsabilités</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pointage de chantier, suivi stocks et saisie gasoil sans accès à la trésorerie"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Créer Rôle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
