import { CURRENCIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';

/**
 * Formats a numeric amount using the selected currency and proper locale.
 * @param {number} amount
 * @param {string} currencyCode e.g. 'INR', 'USD'
 * @param {boolean} showDecimals
 * @returns {string}
 */
export function formatCurrency(amount, currencyCode = 'INR', showDecimals = false) {
  const num = Number(amount) || 0;
  const currencyObj = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  try {
    const formatted = new Intl.NumberFormat(currencyObj.locale, {
      style: 'currency',
      currency: currencyObj.code,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(num);

    return formatted;
  } catch {
    return `${currencyObj.symbol}${num.toLocaleString()}`;
  }
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into user chosen format.
 * @param {string} dateStr
 * @param {string} format 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
 * @returns {string}
 */
export function formatDate(dateStr, format = 'DD/MM/YYYY') {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const [year, month, day] = parts;

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Converts 'YYYY-MM' to human readable 'Month YYYY'
 * @param {string} yearMonth '2026-10'
 * @returns {string} 'October 2026'
 */
export function formatMonthYear(yearMonth) {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

/**
 * Retrieve metadata (label, color, bg) for any category.
 * @param {string} categoryId
 * @param {string} type 'income' | 'expense'
 */
export function getCategoryMeta(categoryId, type = 'expense') {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find((c) => c.id.toLowerCase() === (categoryId || '').toLowerCase());

  if (found) return found;

  // Fallback search in either list
  const fallback = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(
    (c) => c.id.toLowerCase() === (categoryId || '').toLowerCase()
  );

  return (
    fallback || {
      id: categoryId || 'Other',
      label: categoryId || 'Other',
      color: '#64748b',
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
    }
  );
}

/**
 * Safely generates unique IDs for transactions.
 */
export function generateId() {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}
