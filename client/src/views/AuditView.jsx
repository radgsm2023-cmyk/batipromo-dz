import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Clock, User, Building, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    !search || 
    l.action?.toLowerCase().includes(search.toLowerCase()) || 
    l.module?.toLowerCase().includes(search.toLowerCase()) || 
    l.details?.toLowerCase().includes(search.toLowerCase()) ||
    l.auteur_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Journal d'Audit & Sécurité des Opérations</h1>
          <p className="text-xs text-slate-500">
            Traçabilité intégrale des mouvements financiers, décaissements de caisse, affectations et modifications de chantiers
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser le Journal
        </button>
      </div>

      {/* Filter search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par action, utilisateur, module, détail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-4">Horodatage</th>
              <th className="py-2.5 px-3">Utilisateur / Auteur</th>
              <th className="py-2.5 px-3">Module</th>
              <th className="py-2.5 px-3">Action Réalisée</th>
              <th className="py-2.5 px-4">Détails de l'Opération</th>
              <th className="py-2.5 px-3 font-mono">Adresse IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400">
                  Aucun journal d'audit enregistré pour le moment.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.created_at ? log.created_at.replace('T', ' ').slice(0, 19) : '-'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{log.auteur_name || log.user_name || 'Système'}</div>
                    {log.auteur_role && (
                      <span className="text-[10px] text-slate-400 block">{log.auteur_role}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{log.module}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-[380px] text-slate-700 leading-relaxed font-normal">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
