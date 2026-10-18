/**
 * Formats a numeric value into Algerian Dinars (DA / DZD)
 * Example: 1250000 -> "1 250 000,00 DA"
 */
export function formatDA(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0,00 DA';
  const num = Number(amount);
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' DA';
}

/**
 * Compact format for badges and large KPIs
 * Example: 1450000000 -> "1.45 Mds DA", 4500000 -> "4.5 M DA"
 */
export function formatDACompact(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 DA';
  const num = Number(amount);
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + ' Mds DA';
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + ' M DA';
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + ' k DA';
  }
  return num.toLocaleString('fr-DZ') + ' DA';
}

/**
 * Formats ISO date to French readable date
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

/**
 * Chantier status badge styling
 */
export function getStatusBadge(status) {
  switch (status) {
    case 'GROS_OEUVRES':
      return { label: 'Gros Œuvres', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'SECOND_OEUVRE':
      return { label: 'Second Œuvre', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'FINITIONS':
      return { label: 'Finitions', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'ETUDE':
      return { label: 'En Étude / Permis', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'LIVRE':
      return { label: 'Livré & Clôturé', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'EN_PAUSE':
      return { label: 'En Pause', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'EN_COURS':
    default:
      return { label: 'En Cours', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
}

/**
 * User Role formatting
 */
export function getRoleBadge(role) {
  switch (role) {
    case 'ADMIN':
      return { label: 'Promoteur / DG', bg: 'bg-slate-900 text-white' };
    case 'CONDUCTEUR':
      return { label: 'Conducteur Travaux', bg: 'bg-blue-700 text-white' };
    case 'CAISSIER':
      return { label: 'Trésorerie & Caisse', bg: 'bg-emerald-700 text-white' };
    case 'COMPTABLE':
      return { label: 'Chef Comptable', bg: 'bg-indigo-700 text-white' };
    case 'RH':
      return { label: 'RH & Paie', bg: 'bg-purple-700 text-white' };
    case 'MAGASINIER':
      return { label: 'Magasin & Matériel', bg: 'bg-amber-700 text-white' };
    default:
      return { label: role, bg: 'bg-gray-600 text-white' };
  }
}
