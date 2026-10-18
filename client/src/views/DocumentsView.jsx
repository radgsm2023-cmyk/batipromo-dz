import React, { useState, useEffect } from 'react';
import { 
  FolderLock, 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Building, 
  UploadCloud,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';

export default function DocumentsView({ chantiers = [] }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [form, setForm] = useState({
    titre: '',
    type_document: 'PERMIS_CONSTRUIRE',
    chantier_id: '',
    date_document: new Date().toISOString().slice(0, 10),
    file: null
  });

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments({
        chantier_id: selectedChantier || undefined,
        type_document: selectedType || undefined,
        search: search || undefined
      });
      setDocuments(data);
    } catch (e) {
      console.error('Error loading documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedChantier, selectedType, search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await api.createDocument(form);
      setShowUploadModal(false);
      loadDocuments();
    } catch (err) {
      alert(err.message || 'Erreur enregistrement document');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce document du système ?')) return;
    try {
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err) {
      alert(err.message || 'Erreur suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestion Électronique des Documents (GED)</h1>
          <p className="text-xs text-slate-500">
            Centralisation des permis de construire, plans architecturaux d'exécution, contrats de sous-traitance, rapports CTC et procès-verbaux
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <UploadCloud className="w-4 h-4" />
          Ajouter un Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre de document ou nom de fichier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedChantier}
          onChange={(e) => setSelectedChantier(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
        >
          <option value="">Tous les Chantiers</option>
          {chantiers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs py-1.5 px-3 border border-slate-200 rounded-lg bg-white font-medium"
        >
          <option value="">Tous les Types de Documents</option>
          <option value="PERMIS_CONSTRUIRE">Permis de Construire</option>
          <option value="PLAN_ARCHI">Plans d'Architecture & Béton</option>
          <option value="CONTRAT">Contrats & Actes</option>
          <option value="FACTURE">Factures & Décomptes</option>
          <option value="ASSURANCE">Assurances & Décennale</option>
          <option value="AUTRE">Rapports CTC & PV</option>
        </select>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-4">Document / Titre</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Chantier Associé</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Déposé par</th>
              <th className="py-2.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400">
                  Aucun document trouvé.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        PDF
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{doc.titre}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{doc.file_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {doc.type_document}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-blue-700">
                    {doc.chantier_name || 'Général Siège'}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDate(doc.date_document)}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.uploaded_by_name || 'Direction'}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => alert(`Visualisation sécurisée de : ${doc.titre}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Ouvrir
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL UPLOAD */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Enregistrer un Document dans la GED</h3>
            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Titre du Document *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Permis de construire modificatif N°44"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Type de Document</label>
                  <select
                    value={form.type_document}
                    onChange={(e) => setForm({ ...form, type_document: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="PERMIS_CONSTRUIRE">Permis de Construire</option>
                    <option value="PLAN_ARCHI">Plans d'Architecture</option>
                    <option value="CONTRAT">Contrat / Convention</option>
                    <option value="FACTURE">Facture / Décompte</option>
                    <option value="ASSURANCE">Assurance Chantier</option>
                    <option value="AUTRE">Rapport CTC / PV Réception</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Chantier Associé</label>
                  <select
                    value={form.chantier_id}
                    onChange={(e) => setForm({ ...form, chantier_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    <option value="">Document Général Siège...</option>
                    {chantiers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Date du Document</label>
                <input
                  type="date"
                  value={form.date_document}
                  onChange={(e) => setForm({ ...form, date_document: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl text-center">
                <UploadCloud className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">Fichier PDF / Numérisation</span>
                <span className="text-[10px] text-slate-400">Plans DWG, PDF, scans signés</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 border rounded-lg font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">Enregistrer dans la GED</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
