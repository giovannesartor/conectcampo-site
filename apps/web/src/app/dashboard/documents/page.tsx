'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useRef } from 'react';
import { FolderOpen, Upload, FileText, Download, Trash2, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatDate } from '@/lib/format';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const DOC_STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  APPROVED: { label: 'Aprovado', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', color: 'text-red-600 bg-red-50', icon: XCircle },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  RG: 'RG',
  PROPERTY_DEED: 'Escritura do Imóvel',
  INCOME_PROOF: 'Comprovante de Renda',
  BANK_STATEMENT: 'Extrato Bancário',
  TAX_RETURN: 'Declaração de IR',
  PRODUCTION_RECEIPT: 'Nota de Produção',
  INSURANCE_POLICY: 'Apólice de Seguro',
  CAR: 'CAR',
  ITR: 'ITR',
  OTHER: 'Outro',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const { data } = await api.get('/documents/me');
      setDocuments(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'OTHER');
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadDocuments();
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Documentos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie seus documentos para análise de crédito
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : 'Enviar Documento'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Nenhum documento enviado"
          description="Envie seus documentos para agilizar a análise de crédito e melhorar seu score."
          actionLabel="Enviar Documento"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusInfo = DOC_STATUS_MAP[doc.status] || DOC_STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={doc.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {doc.name || DOC_TYPE_LABELS[doc.type] || 'Documento'}
                    </h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{DOC_TYPE_LABELS[doc.type] || doc.type}</span>
                      <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </span>
                  <button className="btn-ghost p-1.5" title="Excluir" onClick={() => handleDelete(doc.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
