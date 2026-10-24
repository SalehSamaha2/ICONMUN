/** Build a CSV that is safe to open in Excel/Sheets (formula injection neutralised, UTF-8 BOM for Arabic etc.). */
const neutralise = (v: unknown): string => {
  let s = v === null || v === undefined ? '' : String(v);
  // A cell starting with = + - @ tab or CR can run as a formula in spreadsheets: prefix with an apostrophe.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
};

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  return '﻿' + [headers, ...rows].map((r) => r.map(neutralise).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
