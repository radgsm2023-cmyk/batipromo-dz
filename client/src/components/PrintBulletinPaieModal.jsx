import React from 'react';
import { X, Printer, Building, UserCheck, ShieldCheck } from 'lucide-react';
import { formatDA, formatDate } from '../utils/formatters';

export default function PrintBulletinPaieModal({ paie, companySettings, onClose }) {
  if (!paie) return null;

  const handlePrint = () => {
    window.print();
  };

  const companyName = companySettings?.company_name || 'BATIPROMO DZ';
  const logoUrl = companySettings?.logo_url;
  const agrement = companySettings?.agrement_promoteur;
  const nif = companySettings?.nif || '002116010987654';
  const adresse = companySettings?.adresse_siege || 'Hydra, Alger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top actions toolbar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-sm">Bulletin de Paie / Fiche de Salaire</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer le Bulletin
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bulletin */}
        <div className="p-8 bg-white text-slate-900 select-text print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-start gap-3">
              {logoUrl ? (
                <div className="w-14 h-14 p-1 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  BP
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{companyName}</h1>
                <p className="text-xs text-slate-500 font-medium">Société de Promotion Immobilière {agrement ? `• Agrément N° ${agrement}` : ''}</p>
                <p className="text-[11px] text-slate-400">{adresse} • NIF: {nif}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md text-xs font-bold uppercase tracking-wider">
                BULLETIN DE PAIE
              </span>
              <p className="font-mono text-xs font-bold text-slate-700 mt-1">Réf: {paie.reference}</p>
              <p className="text-xs text-slate-500">Période: <strong className="text-slate-800">{paie.mois_annee}</strong></p>
            </div>
          </div>

          {/* Employee & Site info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
            <div>
              <span className="text-slate-400 block font-medium">Salarié / Ouvrier :</span>
              <span className="font-bold text-slate-900 text-sm">{paie.nom} {paie.prenom}</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Matricule: {paie.matricule}</span>
              <span className="text-slate-500 block text-[11px]">Fonction: <strong className="text-slate-700">{paie.poste}</strong></span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Affectation Chantier :</span>
              <span className="font-bold text-slate-800 text-sm">{paie.chantier_name || 'Affectation Multi-Sites'}</span>
              <span className="text-slate-500 block text-[11px] mt-0.5">Contrat: {paie.type_contrat}</span>
              <span className="text-slate-500 block text-[11px]">N° CNAS: {paie.numero_cnas || '16-1985-0044-89'}</span>
            </div>
          </div>

          {/* Pay Breakdown Table */}
          <table className="w-full text-xs mb-5 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-300">
                <th className="py-2 px-3 text-left">Rubrique de Paie</th>
                <th className="py-2 px-3 text-center">Base / Jours</th>
                <th className="py-2 px-3 text-right">Gains (DA)</th>
                <th className="py-2 px-3 text-right">Retenues (DA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="py-2.5 px-3 font-medium">Salaire de Base / Rémunération Principale</td>
                <td className="py-2.5 px-3 text-center">{paie.jours_travailles} j</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatDA(paie.salaire_base)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">-</td>
              </tr>
              {paie.montant_heures_sup > 0 && (
                <tr>
                  <td className="py-2 px-3">Majoration Heures Supplémentaires (+25% / +50%)</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">{formatDA(paie.montant_heures_sup)}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                </tr>
              )}
              {paie.primes_chantier > 0 && (
                <tr>
                  <td className="py-2 px-3">Prime de Rendement & Panier de Chantier</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">+{formatDA(paie.primes_chantier)}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                </tr>
              )}
              {paie.avances_deduites > 0 && (
                <tr className="bg-rose-50/50">
                  <td className="py-2 px-3 text-rose-800 font-medium">Déduction Avances sur Salaire (Bons de Caisse)</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">-{formatDA(paie.avances_deduites)}</td>
                </tr>
              )}
              {paie.retenues > 0 && (
                <tr>
                  <td className="py-2 px-3">Cotisation Sécurité Sociale CNAS (9%)</td>
                  <td className="py-2 px-3 text-center">9%</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-600">-{formatDA(paie.retenues)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Net a payer highlight */}
          <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-xl flex items-center justify-between mb-8">
            <div>
              <span className="text-xs uppercase font-extrabold text-indigo-900 tracking-wider">NET À PAYER AU SALARIÉ :</span>
              <p className="text-[11px] text-indigo-700 mt-0.5">Payé en espèces caisse ou virement bancaire</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-950 font-mono tracking-tight">
                {formatDA(paie.net_a_payer)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[100px] flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">La Direction des Ressources Humaines</span>
              <div className="text-[11px] text-slate-400 italic">Cachet & Signature</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[100px] flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Signature de l'Employé / Ouvrier</span>
              <div className="text-[11px] text-slate-400 italic">Précédé de la mention "Lu et approuvé"</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Document légal conforme à la législation algérienne du travail - BATIPROMO DZ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
