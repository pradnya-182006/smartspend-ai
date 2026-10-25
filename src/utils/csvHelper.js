import { generateId } from './formatters';

/**
 * Converts transactions array into a formatted CSV string and triggers a browser download.
 * @param {Array} transactions
 * @param {string} filename
 */
export function exportTransactionsToCSV(transactions, filename = 'finvibe_transactions.csv') {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions available to export.');
  }

  const headers = ['ID', 'Title', 'Amount', 'Type', 'Category', 'Date', 'Notes', 'IsDemo'];

  const rows = transactions.map((t) => [
    t.id || '',
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.amount,
    t.type,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.date,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.isDemo ? 'true' : 'false',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV text into validated transaction objects.
 * Supports standard CSV with Title, Amount, Type, Category, Date, Notes.
 * @param {string} csvText
 * @returns {Array} parsed transactions
 */
export function parseTransactionsCSV(csvText) {
  if (!csvText || !csvText.trim()) {
    throw new Error('CSV file is empty.');
  }

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row.');
  }

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headerParts = parseCSVLine(headerLine);

  const titleIdx = headerParts.findIndex((h) => h.includes('title') || h.includes('desc') || h.includes('name'));
  const amountIdx = headerParts.findIndex((h) => h.includes('amount') || h.includes('value'));
  const typeIdx = headerParts.findIndex((h) => h.includes('type'));
  const categoryIdx = headerParts.findIndex((h) => h.includes('category') || h.includes('cat'));
  const dateIdx = headerParts.findIndex((h) => h.includes('date'));
  const notesIdx = headerParts.findIndex((h) => h.includes('note') || h.includes('comment'));

  if (titleIdx === -1 || amountIdx === -1 || dateIdx === -1) {
    throw new Error('CSV must contain at least "Title", "Amount", and "Date" columns.');
  }

  const transactions = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const title = cols[titleIdx]?.trim();
    const rawAmount = parseFloat(cols[amountIdx]?.replace(/[^0-9.-]+/g, ''));
    const rawType = typeIdx !== -1 ? cols[typeIdx]?.trim().toLowerCase() : '';
    const category = categoryIdx !== -1 ? cols[categoryIdx]?.trim() : 'Other';
    const date = cols[dateIdx]?.trim();
    const notes = notesIdx !== -1 ? cols[notesIdx]?.trim() : '';

    if (!title || isNaN(rawAmount) || rawAmount <= 0 || !date) {
      continue; // Skip malformed rows
    }

    const type = rawType.includes('inc') ? 'income' : 'expense';

    transactions.push({
      id: generateId(),
      title,
      amount: Math.abs(rawAmount),
      type,
      category: category || 'Other',
      date,
      notes: notes || '',
      isDemo: false,
    });
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found in the CSV file.');
  }

  return transactions;
}

/**
 * Handles basic quoted CSV values and commas.
 */
function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' || char === "'") {
      if (inQuotes && text[i + 1] === char) {
        cur += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}
