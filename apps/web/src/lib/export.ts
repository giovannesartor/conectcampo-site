/**
 * Export utility functions for generating CSV and PDF downloads
 */

/**
 * Convert array of objects to CSV string and trigger download
 */
export function exportCSV(
  data: Record<string, any>[],
  filename: string,
  columns?: { key: string; label: string }[],
) {
  if (data.length === 0) return;

  const cols =
    columns ||
    Object.keys(data[0]).map((key) => ({ key, label: key }));

  const header = cols.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(','),
  );

  const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel compatibility
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Generate a simple PDF report (HTML-to-print approach)
 */
export function exportPDF(
  title: string,
  data: Record<string, any>[],
  columns?: { key: string; label: string }[],
) {
  if (data.length === 0) return;

  const cols =
    columns ||
    Object.keys(data[0]).map((key) => ({ key, label: key }));

  const tableRows = data
    .map(
      (row) =>
        '<tr>' +
        cols
          .map(
            (c) =>
              `<td style="border:1px solid #e5e7eb;padding:8px 12px;font-size:12px;">${
                row[c.key] ?? ''
              }</td>`,
          )
          .join('') +
        '</tr>',
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 22px; color: #16a34a; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f9fafb; border: 1px solid #e5e7eb; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; color: #6b7280; }
        tr:nth-child(even) td { background: #f9fafb; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>ConectCampo — ${title}</h1>
      <p class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}</p>
      <table>
        <thead>
          <tr>
            ${cols.map((c) => `<th>${c.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p class="footer">
        ConectCampo · Marketplace de Crédito Agro · conectcampo.digital
      </p>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
