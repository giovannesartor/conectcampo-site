'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportCSV, exportPDF } from '@/lib/export';

interface ExportButtonProps {
  data: Record<string, any>[];
  filename: string;
  title: string;
  columns?: { key: string; label: string }[];
}

export function ExportButton({ data, filename, title, columns }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost flex items-center gap-2 text-sm"
        disabled={data.length === 0}
      >
        <Download className="h-4 w-4" />
        Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-lg z-50">
          <button
            onClick={() => {
              exportCSV(data, filename, columns);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-t-lg transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
            Exportar CSV
          </button>
          <button
            onClick={() => {
              exportPDF(title, data, columns);
              setOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-b-lg transition-colors"
          >
            <FileText className="h-4 w-4 text-red-500" />
            Exportar PDF
          </button>
        </div>
      )}
    </div>
  );
}
