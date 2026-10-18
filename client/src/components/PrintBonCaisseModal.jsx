import React from 'react';
import { X, Printer, CheckCircle2, Building, ShieldCheck, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { formatDA, formatDate } from '../utils/formatters';

export default function PrintBonCaisseModal({ mouvement, companySettings, onClose }) {
  if (!mouvement) return null;

  const isSortie = mouvement.type === 'SORTIE';
  const isPending = mouvement.status === 'EN_ATTENTE_VALIDATION';
  const isRejected = mouvement.status === 'REJETE';
  const isValide = mouvement.status === 'VALIDE' || (!isPending && !isRejected);

  const handlePrint = () => {
    window.print();
  };

  const companyName = companySettings?.company_name || 'BATIPROMO DZ';
  const logoUrl = companySettings?.logo_url;
  const cachetUrl = companySettings?.cachet_url;
  const agrement = companySettings?.agrement_promoteur || 'AGR-MIN-HABITAT-2021-0487';
  const nif = companySettings?.nif || '002116010987654';
  const adresse = companySettings?.adresse_siege || 'Hydra, Alger';
  const phone = companySettings?.telephone_1 || '+213 (0) 23 45 67 89';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Top actions toolbar (hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm">Aperçu & Impression du Bon de Caisse</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Imprimer le Bon
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Sheet */}
        <div className="p-8 bg-white text-slate-900 select-text print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-start gap-3">
              {logoUrl ? (
                <div className="w-16 h-16 p-1 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <img src={logoUrl} alt="Logo Promoteur" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                  BP
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {companyName}
                </h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Promotion Immobilière {agrement ? `• Agrément N° ${agrement}` : ''}
                </p>
                <p className="text-[11px] text-slate-400">
                  Siège Social : {adresse} • Tél : {phone}
                </p>
                {nif && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    NIF: {nif} {companySettings?.registre_commerce ? `• RC: ${companySettings.registre_commerce}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${isSortie ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                {isSortie ? 'BON DE DÉCAISSEMENT' : 'BON D\'ENCAISSEMENT'}
              </span>
              <p className="font-mono text-sm font-bold text-slate-800 mt-2">N° {mouvement.reference}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(mouvement.date)}</p>
            </div>
          </div>

          {/* Validation Status Stamp */}
          {isPending && (
            <div className="mb-6 p-3 bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl flex items-center justify-between text-amber-900">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
                <div>
                  <span className="font-extrabold text-xs uppercase tracking-wider block text-amber-900">
                    EN ATTENTE DE VALIDATION PAR LA DIRECTION GÉNÉRALE
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Opération sensible : aucun paiement en espèces ne doit être effectué sans le visa de validation.
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-amber-200 text-amber-900 font-black text-[10px] tracking-wider uppercase">
                NON DÉCAISSÉ
              </span>
            </div>
          )}

          {isValide && (
            <div className="mb-6 p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-xs">
                  OPÉRATION APPROUVÉE & VALIDÉE PAR LA DIRECTION GÉNÉRALE (ADMIN)
                </span>
              </div>
              {mouvement.validator_name && (
                <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                  Validé par : {mouvement.validator_name}
                </span>
              )}
            </div>
          )}

          {isRejected && (
            <div className="mb-6 p-3 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between text-rose-900">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <div>
                  <span className="font-extrabold text-xs uppercase tracking-wider block text-rose-900">
                    OPÉRATION REJETÉE PAR L'ADMINISTRATION
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Motif : {mouvement.rejection_reason || 'Décaissement non autorisé'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-rose-200 text-rose-900 font-black text-[10px] uppercase">
                REJETÉ
              </span>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Caisse Débitée / Créditée :</span>
              <span className="font-bold text-slate-800 text-sm">{mouvement.caisse_name || 'Caisse de Fond de Roulement'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Chantier Concerné :</span>
              <span className="font-bold text-slate-800 text-sm">{mouvement.chantier_name || 'Frais Généraux Siège'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">{isSortie ? 'Bénéficiaire / Destinataire :' : 'Émetteur / Provenance :'}</span>
              <span className="font-bold text-slate-900 text-sm">
                {mouvement.beneficiaire_name || mouvement.fournisseur_name || 'Intervenant Chantier'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Mode de Règlement :</span>
              <span className="font-semibold text-slate-800">{mouvement.mode_paiement || 'ESPECES'}</span>
              {mouvement.piece_justificative && (
                <span className="text-slate-500 block text-[11px]">Réf. Pièce: {mouvement.piece_justificative}</span>
              )}
            </div>
          </div>

          {/* Motif & Categorization */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Motif & Justification de la Dépense :</div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed font-medium">
              {mouvement.motif}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">Catégorie: {mouvement.categorie}</span>
              {mouvement.chantier_code && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono font-medium">{mouvement.chantier_code}</span>
              )}
            </div>
          </div>

          {/* Amount Box */}
          <div className="mb-8 p-4 rounded-xl bg-blue-50/80 border-2 border-blue-200 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-blue-900 tracking-wider">Montant Net en Dinars Algériens :</span>
              <p className="text-xs text-blue-700 mt-0.5 italic">Payable en Dinars Algériens (DZD)</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-900 font-mono tracking-tight">
                {formatDA(mouvement.montant)}
              </span>
            </div>
          </div>

          {/* Official Signatures Grid (4 boxes: Caissier, Conducteur, Bénéficiaire, Direction Générale) */}
          <div className="grid grid-cols-4 gap-3 pt-6 border-t border-slate-200 text-center">
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 min-h-[110px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Le Caissier</span>
              <div className="text-[10px] text-slate-400 italic">Signature & Date</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 min-h-[110px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Conducteur Travaux</span>
              <div className="text-[10px] text-slate-400 italic">Visa Chantier</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 min-h-[110px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Bénéficiaire</span>
              <div className="text-[10px] text-slate-400 italic">Pour Acquit (Reçu)</div>
            </div>
            <div className={`border rounded-xl p-2.5 min-h-[110px] flex flex-col justify-between items-center relative overflow-hidden ${
              isValide ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <span className="text-[10px] font-bold text-slate-700 uppercase">Visa Direction (Admin)</span>
              {isValide ? (
                cachetUrl ? (
                  <img src={cachetUrl} alt="Cachet Officiel" className="w-14 h-14 object-contain my-1" />
                ) : (
                  <div className="text-[10px] text-emerald-700 font-bold my-auto">
                    ✓ APPROUVÉ DG
                  </div>
                )
              ) : (
                <div className="text-[10px] text-slate-400 italic my-auto">Visa DG requis</div>
              )}
              <span className="text-[8px] text-slate-400">Direction Générale</span>
            </div>
          </div>

          {/* Bottom security notice & footer */}
          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 space-y-1">
            <div className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{companySettings?.mention_legale_documents || 'Document comptable officiel BATIPROMO DZ - Généré par le Système de Gestion Multi-Chantiers'}</span>
            </div>
            {companySettings?.pied_de_page_documents && (
              <p className="text-[9px] text-slate-400 font-mono">
                {companySettings.pied_de_page_documents}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
