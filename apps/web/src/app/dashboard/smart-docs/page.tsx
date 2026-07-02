'use client';

import { useEffect, useState } from 'react';
import { FileScan, Trash2, Sparkles, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Modal } from '@/components/dashboard/Modal';
import { Spinner, PageHeader } from '@/components/dashboard/PageKit';
import toast from 'react-hot-toast';

const DOC_TYPES = ['MATRICULA','CAR','NOTA_FISCAL','CONTRATO','CPR','LAUDO','OUTRO'];
const TYPE_LABEL: Record<string, string> = {
  MATRICULA: 'Matrícula', CAR: 'CAR', NOTA_FISCAL: 'Nota fiscal', CONTRATO: 'Contrato',
  CPR: 'CPR', LAUDO: 'Laudo', OUTRO: 'Outro',
};
const STATUS_STYLE: Record<string, string> = {
  CONCLUIDO: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
  PENDENTE: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
  PROCESSANDO: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
  ERRO: 'text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
};

interface Extraction {
  id: string; fileName: string; docType: string; status: string;
  extracted: Record<string, unknown> | null; summary: string | null; confidence: number | null; createdAt: string;
}

export default function SmartDocsPage() {
  const [docs, setDocs] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [detail, setDetail] = useState<Extraction | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/smart-docs')
      .then((r) => setDocs(r.data))
      .catch(() => toast.error('Não foi possível carregar os documentos.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (id: string) => { try { await api.delete(`/smart-docs/${id}`); load(); } catch { toast.error('Erro'); } };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Central de Documentos Inteligente" subtitle="Extração de dados de matrículas, CAR, notas e contratos" icon={<FileScan className="h-6 w-6 text-brand-600" />} onAdd={() => setShow(true)} addLabel="Analisar documento" />

      {docs.length === 0 ? (
        <EmptyState icon={FileScan} title="Nenhum documento analisado" description="Cole o texto de um documento para extrair automaticamente CPF/CNPJ, CAR, matrícula, datas e valores." actionLabel="Analisar documento" onAction={() => setShow(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((d) => (
            <div key={d.id} className="card cursor-pointer hover:shadow-md transition" onClick={() => setDetail(d)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-500" />
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">{TYPE_LABEL[d.docType]}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[d.status]}`}>{d.status}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white truncate">{d.fileName}</p>
              {d.summary && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{d.summary}</p>}
              <div className="mt-3 flex items-center justify-between">
                {d.confidence != null && (
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Sparkles className="h-3 w-3" /> {Math.round(d.confidence * 100)}% confiança</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); remove(d.id); }} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && <AnalyzeModal onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
      {detail && (
        <Modal title={detail.fileName} onClose={() => setDetail(null)} maxWidth="max-w-xl">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs">{TYPE_LABEL[detail.docType]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[detail.status]}`}>{detail.status}</span>
            </div>
            {detail.summary && <p className="text-sm text-gray-700 dark:text-gray-300">{detail.summary}</p>}
            {detail.extracted && Object.keys(detail.extracted).length > 0 && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Campos extraídos</p>
                <dl className="space-y-1">
                  {Object.entries(detail.extracted).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <dt className="text-gray-500 dark:text-gray-400 capitalize">{k}</dt>
                      <dd className="text-gray-900 dark:text-white font-medium text-right">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <p className="text-xs text-gray-400">Analisado em {formatDateTime(detail.createdAt)}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AnalyzeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ fileName: '', docType: '', rawText: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileName || !form.rawText) { toast.error('Informe o nome e o texto do documento.'); return; }
    setSaving(true);
    try {
      await api.post('/smart-docs', { fileName: form.fileName, docType: form.docType || undefined, rawText: form.rawText });
      toast.success('Documento analisado'); onSaved();
    } catch { toast.error('Erro ao analisar'); } finally { setSaving(false); }
  };
  return (
    <Modal title="Analisar documento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Nome do arquivo</label><input className="input" placeholder="matricula-123.pdf" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} /></div>
          <div><label className="label">Tipo (opcional)</label><select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}><option value="">Detectar automaticamente</option>{DOC_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></div>
        </div>
        <div>
          <label className="label">Texto do documento (OCR / colar)</label>
          <textarea className="input min-h-[160px]" placeholder="Cole aqui o conteúdo do documento..." value={form.rawText} onChange={(e) => setForm({ ...form, rawText: e.target.value })} />
        </div>
        <p className="text-xs text-gray-400">A extração identifica CPF/CNPJ, CAR, matrícula, datas, valores e área automaticamente.</p>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Analisando...' : 'Analisar'}</button>
      </form>
    </Modal>
  );
}
