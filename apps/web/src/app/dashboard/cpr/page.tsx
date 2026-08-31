'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ScrollText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Landmark,
  TrendingUp,
  ChevronRight,
  X,
  Loader2,
  DollarSign,
  PenLine,
  Copy,
  Download,
  ListChecks,
  ShieldCheck,
  Database,
  Scale,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { EmptyState } from '@/components/dashboard/EmptyState';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Modal } from '@/components/dashboard/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CprSummary {
  total: number;
  emitidas: number;
  registradas: number;
  liquidadas: number;
  emissoes: number;
  captacoes: number;
  totalValor: number;
  totalCaptacao: number;
  totalFeeConectCampo: number;
}

interface CprItem {
  id: string;
  numeroCpr: string | null;
  purpose: 'EMISSAO' | 'CAPTACAO';
  type: 'FISICA' | 'FINANCEIRA';
  status: string;
  produto: string;
  quantidade: number;
  unidade: string;
  valorTotal: number | null;
  dataVencimento: string;
  emitenteNome: string;
  credorNome: string;
  safraAno: string | null;
  pdfUrl: string | null;
  conectcampoFeeValue: number | null;
  signatureStatus: string | null;
  createdAt: string;
}

interface SignatureParty {
  nome: string;
  signedAt: string | null;
  token: string | null;
  signUrl?: string | null;
}

interface SignatureInfo {
  provider?: string;
  signatureStatus: string;
  documentHash: string | null;
  signedFileUrl?: string | null;
  emitente: SignatureParty;
  credor: SignatureParty;
}

interface CreateCprForm {
  purpose: 'EMISSAO' | 'CAPTACAO';
  type: 'FISICA' | 'FINANCEIRA';
  emitenteNome: string;
  emitenteCpfCnpj: string;
  emitenteEndereco: string;
  emitenteCep: string;
  emitenteQualificacao: string;
  emitenteRepresentante: string;
  emitenteCidade: string;
  emitenteEstado: string;
  emitenteCarNumero: string;
  emitenteEmail: string;
  emitenteTelefone: string;
  emitenteBanco: string;
  emitenteAgencia: string;
  emitenteConta: string;
  credorNome: string;
  credorCpfCnpj: string;
  credorEndereco: string;
  credorCidade: string;
  credorEstado: string;
  credorCep: string;
  credorQualificacao: string;
  credorRepresentante: string;
  credorTipo: string;
  credorEmail: string;
  credorTelefone: string;
  produto: string;
  quantidade: string;
  unidade: string;
  precoUnitario: string;
  valorFace: string;
  produtoQualidade: string;
  produtoPadrao: string;
  propriedadeNome: string;
  propriedadeEndereco: string;
  propriedadeMatricula: string;
  indicePreco: string;
  fontePreco: string;
  mercadoReferencia: string;
  localEntrega: string;
  dataEntrega: string;
  dataVencimento: string;
  prazoAnos: string;
  carenciaAnos: string;
  safras: string[];
  garantiaTipo: string;
  garantiaDescricao: string;
  garantiaValor: string;
  garantiaProprietario: string;
  garantiaRegistro: string;
  garantiaGrau: string;
  finalidade: string;
  valorCaptacao: string;
  valorCredito: string;
  valorIof: string;
  valorLiquido: string;
  taxaJurosMensal: string;
  taxaJurosAnual: string;
  cetMensal: string;
  cetAnual: string;
  multaMoraPct: string;
  jurosMoraMensalPct: string;
  encargosAdicionais: string;
  formaLiquidacao: string;
  localPagamento: string;
  localEmissao: string;
  dataEmissao: string;
  registradora: string;
  numeroRegistro: string;
  foroCidade: string;
  foroEstado: string;
  avalistaNome: string;
  avalistaCpfCnpj: string;
  avalistaQualificacao: string;
  avalistaEndereco: string;
  cronograma: Array<{ vencimento: string; principal: string; encargos: string }>;
  observacoes: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RASCUNHO:   { label: 'Rascunho',    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800',            icon: <Clock className="h-3 w-3" /> },
  EMITIDA:    { label: 'Emitida',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  REGISTRADA: { label: 'Registrada',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="h-3 w-3" /> },
  LIQUIDADA:  { label: 'Liquidada',   color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',          icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELADA:  { label: 'Cancelada',   color: 'text-red-600 bg-red-50 dark:bg-red-950/30',             icon: <AlertCircle className="h-3 w-3" /> },
  VENCIDA:    { label: 'Vencida',     color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',    icon: <AlertCircle className="h-3 w-3" /> },
};

const PURPOSE_CONFIG = {
  EMISSAO:  { label: 'Emissão de CPR',   color: 'text-violet-700 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800' },
  CAPTACAO: { label: 'Captação de Crédito', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' },
};

const EMPTY_FORM: CreateCprForm = {
  purpose: 'EMISSAO',
  type: 'FINANCEIRA',
  emitenteNome: '', emitenteCpfCnpj: '', emitenteEndereco: '', emitenteCep: '', emitenteQualificacao: '', emitenteRepresentante: '', emitenteCidade: '', emitenteEstado: '', emitenteCarNumero: '',
  emitenteEmail: '', emitenteTelefone: '', emitenteBanco: '', emitenteAgencia: '', emitenteConta: '',
  credorNome: '', credorCpfCnpj: '', credorEndereco: '', credorCidade: '', credorEstado: '', credorCep: '', credorQualificacao: '', credorRepresentante: '', credorTipo: '', credorEmail: '', credorTelefone: '',
  produto: '', quantidade: '', unidade: 'sacas', precoUnitario: '', valorFace: '', produtoQualidade: '', produtoPadrao: '', propriedadeNome: '', propriedadeEndereco: '', propriedadeMatricula: '', indicePreco: '', fontePreco: '', mercadoReferencia: '',
  localEntrega: '', dataEntrega: '',
  dataVencimento: '', prazoAnos: '', carenciaAnos: '', safras: [],
  garantiaTipo: '', garantiaDescricao: '', garantiaValor: '', garantiaProprietario: '', garantiaRegistro: '', garantiaGrau: '',
  finalidade: '', valorCaptacao: '', valorCredito: '', valorIof: '', valorLiquido: '', taxaJurosMensal: '', taxaJurosAnual: '', cetMensal: '', cetAnual: '', multaMoraPct: '', jurosMoraMensalPct: '', encargosAdicionais: '', formaLiquidacao: '', localPagamento: '', localEmissao: '', dataEmissao: '', registradora: '', numeroRegistro: '', foroCidade: '', foroEstado: '',
  avalistaNome: '', avalistaCpfCnpj: '', avalistaQualificacao: '', avalistaEndereco: '',
  cronograma: [],
  observacoes: '',
};

// ─── Máscaras ─────────────────────────────────────────────────────────────────

function maskCpfCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CprPage() {
  const confirmAction = useConfirmDialog();
  const [summary, setSummary] = useState<CprSummary | null>(null);
  const [cprs, setCprs] = useState<CprItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCprForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [signModal, setSignModal] = useState<{ cpr: CprItem; info: SignatureInfo } | null>(null);
  const [copied, setCopied] = useState<string>('');
  // Preços vêm da fonte única (/pricing); defaults como fallback
  const [pricing, setPricing] = useState({ fisicaFlat: 2500, financeiraRatePct: 0.8, captacaoFeeRatePct: 6 });

  useEffect(() => {
    api.get('/pricing').then(r => { if (r.data?.cpr) setPricing(r.data.cpr); }).catch(() => {});
  }, []);

  const load = async () => {
    try {
      const [sum, list] = await Promise.all([
        api.get('/cpr/summary').then(r => r.data),
        api.get('/cpr?perPage=50').then(r => r.data.data),
      ]);
      setSummary(sum);
      setCprs(list);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        purpose: form.purpose,
        type: form.type,
        emitenteNome: form.emitenteNome,
        emitenteCpfCnpj: form.emitenteCpfCnpj,
        emitenteEndereco: form.emitenteEndereco || undefined,
        emitenteCidade: form.emitenteCidade || undefined,
        emitenteEstado: form.emitenteEstado || undefined,
        emitenteCarNumero: form.emitenteCarNumero || undefined,
        emitenteEmail: form.emitenteEmail || undefined,
        emitenteTelefone: form.emitenteTelefone || undefined,
        credorNome: form.credorNome,
        credorCpfCnpj: form.credorCpfCnpj,
        credorTipo: form.credorTipo || undefined,
        credorEmail: form.credorEmail || undefined,
        credorTelefone: form.credorTelefone || undefined,
        produto: form.produto,
        quantidade: parseFloat(form.quantidade),
        unidade: form.unidade,
        safraAno: form.safras.length ? form.safras.join(', ') : undefined,
        precoUnitario: form.precoUnitario ? parseFloat(form.precoUnitario) : undefined,
        valorFace: form.valorFace ? parseFloat(form.valorFace) : undefined,
        localEntrega: form.localEntrega || undefined,
        dataEntrega: form.dataEntrega || undefined,
        dataVencimento: form.dataVencimento,
        prazoMeses: form.prazoAnos ? parseInt(form.prazoAnos) * 12 : undefined,
        carenciaMeses: form.carenciaAnos ? parseInt(form.carenciaAnos) * 12 : undefined,
        garantiaTipo: form.garantiaTipo || undefined,
        garantiaDescricao: form.garantiaDescricao || undefined,
        garantiaValor: form.garantiaValor ? parseFloat(form.garantiaValor) : undefined,
        finalidade: form.finalidade || undefined,
        valorCaptacao: form.valorCaptacao ? parseFloat(form.valorCaptacao) : undefined,
        contractData: {
          localEmissao: form.localEmissao || undefined,
          dataEmissao: form.dataEmissao || undefined,
          emitenteQualificacao: form.emitenteQualificacao || undefined,
          emitenteCep: form.emitenteCep || undefined,
          emitenteRepresentante: form.emitenteRepresentante || undefined,
          emitenteBanco: form.emitenteBanco || undefined,
          emitenteAgencia: form.emitenteAgencia || undefined,
          emitenteConta: form.emitenteConta || undefined,
          credorQualificacao: form.credorQualificacao || undefined,
          credorEndereco: form.credorEndereco || undefined,
          credorCidade: form.credorCidade || undefined,
          credorEstado: form.credorEstado || undefined,
          credorCep: form.credorCep || undefined,
          credorRepresentante: form.credorRepresentante || undefined,
          avalistas: form.avalistaNome ? [{
            nome: form.avalistaNome,
            cpfCnpj: form.avalistaCpfCnpj || undefined,
            qualificacao: form.avalistaQualificacao || undefined,
            endereco: form.avalistaEndereco || undefined,
          }] : [],
          produtoQualidade: form.produtoQualidade || undefined,
          produtoPadrao: form.produtoPadrao || undefined,
          propriedadeNome: form.propriedadeNome || undefined,
          propriedadeEndereco: form.propriedadeEndereco || undefined,
          propriedadeMatricula: form.propriedadeMatricula || undefined,
          indicePreco: form.indicePreco || undefined,
          fontePreco: form.fontePreco || undefined,
          mercadoReferencia: form.mercadoReferencia || undefined,
          valorCredito: form.valorCredito ? parseFloat(form.valorCredito) : undefined,
          valorIof: form.valorIof ? parseFloat(form.valorIof) : undefined,
          valorLiquido: form.valorLiquido ? parseFloat(form.valorLiquido) : undefined,
          taxaJurosMensal: form.taxaJurosMensal ? parseFloat(form.taxaJurosMensal) : undefined,
          taxaJurosAnual: form.taxaJurosAnual ? parseFloat(form.taxaJurosAnual) : undefined,
          cetMensal: form.cetMensal ? parseFloat(form.cetMensal) : undefined,
          cetAnual: form.cetAnual ? parseFloat(form.cetAnual) : undefined,
          multaMoraPct: form.multaMoraPct ? parseFloat(form.multaMoraPct) : undefined,
          jurosMoraMensalPct: form.jurosMoraMensalPct ? parseFloat(form.jurosMoraMensalPct) : undefined,
          encargosAdicionais: form.encargosAdicionais || undefined,
          formaLiquidacao: form.formaLiquidacao || undefined,
          localPagamento: form.localPagamento || undefined,
          garantiaProprietario: form.garantiaProprietario || undefined,
          garantiaRegistro: form.garantiaRegistro || undefined,
          garantiaGrau: form.garantiaGrau || undefined,
          registradora: form.registradora || undefined,
          numeroRegistro: form.numeroRegistro || undefined,
          foroCidade: form.foroCidade || undefined,
          foroEstado: form.foroEstado || undefined,
          contatoNotificacoes: [form.emitenteEmail, form.credorEmail].filter(Boolean).join(' · ') || undefined,
          cronograma: form.cronograma
            .filter(item => item.vencimento || item.principal || item.encargos)
            .map((item, index) => ({
              numero: index + 1,
              vencimento: item.vencimento || undefined,
              principal: item.principal ? parseFloat(item.principal) : undefined,
              encargos: item.encargos ? parseFloat(item.encargos) : 0,
              total: (item.principal ? parseFloat(item.principal) : 0) + (item.encargos ? parseFloat(item.encargos) : 0),
            })),
        },
        observacoes: form.observacoes || undefined,
      };
      await api.post('/cpr', payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Erro ao criar CPR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmit = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/cpr/${id}/emit`);
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const cpr = cprs.find((item) => item.id === id);
    const { confirmed, reason } = await confirmAction({
      title: 'Cancelar esta CPR?',
      description: 'A CPR será cancelada e deixará de seguir para emissão, assinatura ou registro. O histórico permanecerá auditável.',
      confirmLabel: 'Cancelar CPR',
      tone: 'warning',
      details: cpr ? [
        { label: 'Emitente', value: cpr.emitenteNome },
        { label: 'Valor', value: formatCurrency(Number(cpr.valorTotal ?? 0)) },
      ] : undefined,
      requireReason: true,
      reasonLabel: 'Motivo do cancelamento',
    });
    if (!confirmed) return;
    setActionLoading(id);
    try {
      await api.delete(`/cpr/${id}`, { data: { reason } });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDocument = async (id: string) => {
    setActionLoading(id);
    try {
      const { data } = await api.get(`/cpr/${id}/document`);
      const w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(data.html);
        w.document.close();
      } else {
        toast.error('Permita pop-ups para abrir a minuta da CPR.');
      }
    } catch {
      toast.error('Não foi possível gerar a minuta agora.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePdf = async (id: string) => {
    setActionLoading(id);
    try {
      const { data } = await api.get(`/cpr/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `CPR-${id.slice(0, 8)}-ConectCampo.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível baixar o PDF da CPR.');
    } finally {
      setActionLoading(null);
    }
  };

  const openSignature = async (cpr: CprItem) => {
    if (cpr.status === 'RASCUNHO') {
      toast('Emita a CPR antes de solicitar assinaturas.');
      return;
    }
    setActionLoading(cpr.id);
    try {
      if (!cpr.signatureStatus || cpr.signatureStatus === 'NAO_INICIADA') {
        await api.post(`/cpr/${cpr.id}/signature/request`);
      }
      const { data } = await api.get<SignatureInfo>(`/cpr/${cpr.id}/signature`);
      setSignModal({ cpr, info: data });
      await load();
    } catch {
      toast.error('Não foi possível abrir a assinatura agora.');
    } finally {
      setActionLoading(null);
    }
  };

  const resetSignature = async (cprId: string) => {
    const { confirmed, reason } = await confirmAction({
      title: 'Gerar novos links de assinatura?',
      description: 'Os links anteriores serão invalidados. Assinaturas já coletadas podem precisar ser refeitas pelos participantes.',
      confirmLabel: 'Gerar novos links',
      tone: 'warning',
      requireReason: true,
      reasonLabel: 'Motivo da renovação',
    });
    if (!confirmed) return;
    setActionLoading(cprId);
    try {
      await api.post(`/cpr/${cprId}/signature/request`, { reason });
      const { data } = await api.get<SignatureInfo>(`/cpr/${cprId}/signature`);
      setSignModal(prev => (prev ? { ...prev, info: data } : prev));
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const downloadSigned = async (cprId: string) => {
    try {
      const { data } = await api.get(`/cpr/${cprId}/signed-file`);
      if (data?.url) window.open(data.url, '_blank');
      else toast.error('PDF assinado ainda não disponível.');
    } catch {
      toast.error('PDF assinado ainda não disponível.');
    }
  };

  const partyUrl = (party: SignatureParty) =>
    party.signUrl ||
    (party.token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cpr/assinar/${party.token}` : '');

  const copyLink = (party: SignatureParty, who: string) => {
    const url = partyUrl(party);
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopied(who);
    setTimeout(() => setCopied(''), 1800);
  };

  const set = (k: keyof CreateCprForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  // Setter com máscara (CPF/CNPJ, telefone)
  const setMasked = (k: keyof CreateCprForm, mask: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: mask(e.target.value) }));

  // Auto-preenchimento por CNPJ (Receita via BrasilAPI)
  const lookupCnpj = async (who: 'emitente' | 'credor') => {
    const raw = who === 'emitente' ? form.emitenteCpfCnpj : form.credorCpfCnpj;
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 14) return;
    try {
      const { data } = await api.get(`/enrichment/cnpj/${digits}`);
      if (!data?.razaoSocial) return;
      setForm(prev =>
        who === 'emitente'
          ? {
              ...prev,
              emitenteNome: prev.emitenteNome || data.razaoSocial || '',
              emitenteCidade: prev.emitenteCidade || data.municipio || '',
              emitenteEstado: prev.emitenteEstado || data.uf || '',
              emitenteEmail: prev.emitenteEmail || data.email || '',
            }
          : {
              ...prev,
              credorNome: prev.credorNome || data.razaoSocial || '',
              credorEmail: prev.credorEmail || data.email || '',
            },
      );
      toast.success('Dados do CNPJ preenchidos.');
    } catch {
      /* silencioso — CNPJ pode não existir ou API indisponível */
    }
  };

  // ─── Prazo / Safras / Carência ──────────────────────────────────────────────
  const prazoAnosNum = form.prazoAnos ? parseInt(form.prazoAnos) : 0;
  const carenciaMaxAnos = prazoAnosNum > 0 ? Math.min(5, prazoAnosNum) : 5;

  // Safras candidatas: ano-safra corrente + próximos 15 anos
  const SAFRA_OPTIONS = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 16 }, (_, i) => `${base + i}/${base + i + 1}`);
  }, []);

  const onPrazoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const anos = e.target.value;
    const n = anos ? parseInt(anos) : 0;
    setForm(prev => ({
      ...prev,
      prazoAnos: anos,
      // mantém no máximo `n` safras selecionadas
      safras: n > 0 ? prev.safras.slice(0, n) : prev.safras,
      // carência não pode exceder o prazo (máx. 5 anos)
      carenciaAnos:
        prev.carenciaAnos && parseInt(prev.carenciaAnos) > Math.min(5, n || 5)
          ? String(Math.min(5, n || 5))
          : prev.carenciaAnos,
    }));
  };

  const toggleSafra = (s: string) =>
    setForm(prev => {
      if (prev.safras.includes(s)) {
        return { ...prev, safras: prev.safras.filter(x => x !== s) };
      }
      if (prazoAnosNum > 0 && prev.safras.length >= prazoAnosNum) return prev; // respeita o limite do prazo
      return { ...prev, safras: [...prev.safras, s].sort() };
    });

  const addInstallment = () =>
    setForm(prev => ({
      ...prev,
      cronograma: [...prev.cronograma, { vencimento: '', principal: '', encargos: '' }],
    }));

  const updateInstallment = (
    index: number,
    key: 'vencimento' | 'principal' | 'encargos',
    value: string,
  ) => setForm(prev => ({
    ...prev,
    cronograma: prev.cronograma.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item,
    ),
  }));

  const removeInstallment = (index: number) =>
    setForm(prev => ({
      ...prev,
      cronograma: prev.cronograma.filter((_, itemIndex) => itemIndex !== index),
    }));

  const completenessFields = [
    form.emitenteNome, form.emitenteCpfCnpj, form.emitenteEndereco, form.emitenteCidade,
    form.credorNome, form.credorCpfCnpj, form.credorEndereco, form.produto,
    form.quantidade, form.valorFace, form.dataVencimento, form.propriedadeNome,
    form.propriedadeEndereco, form.localEmissao, form.formaLiquidacao, form.localPagamento,
    form.garantiaTipo || 'sem-garantia', form.foroCidade,
  ];
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-amber-50/50 p-5 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:via-gray-900 dark:to-amber-950/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-emerald-600" />
            Gerador de CPR
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Minuta completa, PDF profissional, assinatura e acompanhamento do registro
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 dark:border-emerald-800 dark:bg-gray-900/70"><ListChecks className="h-3.5 w-3.5" /> Dados essenciais</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 dark:border-emerald-800 dark:bg-gray-900/70"><ShieldCheck className="h-3.5 w-3.5" /> Garantias e aval</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 dark:border-emerald-800 dark:bg-gray-900/70"><Scale className="h-3.5 w-3.5" /> Cláusulas padronizadas</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 dark:border-emerald-800 dark:bg-gray-900/70"><Database className="h-3.5 w-3.5" /> Registro controlado</span>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova CPR
        </button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total de CPRs',      value: summary.total,       icon: <ScrollText className="h-5 w-5 text-gray-500" />,    color: 'border-gray-200' },
            { label: 'Emitidas',           value: summary.emitidas,    icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,  color: 'border-blue-200' },
            { label: 'Emissões',           value: summary.emissoes,    icon: <FileText className="h-5 w-5 text-violet-500" />,    color: 'border-violet-200' },
            { label: 'Captações',          value: summary.captacoes,   icon: <Landmark className="h-5 w-5 text-amber-500" />,     color: 'border-amber-200' },
          ].map(k => (
            <div key={k.label} className={`bg-white dark:bg-gray-800 border ${k.color} dark:border-gray-700 rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1">{k.icon}<span className="text-xs text-gray-500 dark:text-gray-400">{k.label}</span></div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (summary.totalValor > 0 || summary.totalCaptacao > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total CPRs</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.totalValor)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volume Captação</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(summary.totalCaptacao)}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Fee ConectCampo (6%)
            </p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(summary.totalFeeConectCampo)}</p>
          </div>
        </div>
      )}

      {/* Lista de CPRs */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : cprs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma CPR criada ainda"
          description="Emita uma Cédula de Produto Rural ou use uma CPR para captar crédito."
          actionLabel="Nova CPR"
          onAction={() => { setShowForm(true); setError(''); }}
        />
      ) : (
        <>
        <div className="grid gap-3 md:hidden">
          {cprs.map(cpr => {
            const status = STATUS_CONFIG[cpr.status] ?? { label: cpr.status, color: 'text-gray-500 bg-gray-100', icon: null };
            const purpose = PURPOSE_CONFIG[cpr.purpose];
            const isLoading = actionLoading === cpr.id;
            return (
              <article key={cpr.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] text-gray-400">{cpr.numeroCpr || 'RASCUNHO SEM NÚMERO'}</p>
                    <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{cpr.produto} · {Number(cpr.quantidade).toLocaleString('pt-BR')} {cpr.unidade}</h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Credor: {cpr.credorNome}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${status.color}`}>{status.icon}{status.label}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3 text-xs dark:bg-gray-900/50">
                  <div><p className="text-gray-400">Valor</p><p className="font-semibold text-gray-900 dark:text-white">{cpr.valorTotal ? formatCurrency(Number(cpr.valorTotal)) : 'A definir'}</p></div>
                  <div><p className="text-gray-400">Vencimento</p><p className="font-semibold text-gray-900 dark:text-white">{new Date(cpr.dataVencimento).toLocaleDateString('pt-BR')}</p></div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${purpose.color}`}>{purpose.label}</span>
                  <button onClick={() => handlePdf(cpr.id)} disabled={isLoading} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300"><Download className="h-3.5 w-3.5" /> PDF</button>
                  <button onClick={() => handleDocument(cpr.id)} disabled={isLoading} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"><FileText className="h-3.5 w-3.5" /> Prévia</button>
                  {cpr.status === 'RASCUNHO' ? (
                    <button onClick={() => handleEmit(cpr.id)} disabled={isLoading} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white"><ChevronRight className="h-3.5 w-3.5" /> Emitir</button>
                  ) : (
                    <button onClick={() => openSignature(cpr)} disabled={isLoading} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white"><PenLine className="h-3.5 w-3.5" /> Assinatura</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <div className="hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Número', 'Finalidade', 'Produto', 'Qtd', 'Valor Total', 'Credor', 'Vencimento', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {cprs.map(cpr => {
                  const status = STATUS_CONFIG[cpr.status] ?? { label: cpr.status, color: 'text-gray-500 bg-gray-100', icon: null };
                  const purpose = PURPOSE_CONFIG[cpr.purpose];
                  const isLoading = actionLoading === cpr.id;
                  return (
                    <tr key={cpr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {cpr.numeroCpr ?? <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${purpose.color}`}>
                          {purpose.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {cpr.produto}
                        {cpr.safraAno && <span className="text-gray-400 text-xs ml-1">({cpr.safraAno})</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {Number(cpr.quantidade).toLocaleString('pt-BR')} {cpr.unidade}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {cpr.valorTotal ? formatCurrency(Number(cpr.valorTotal)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cpr.credorNome}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {new Date(cpr.dataVencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon}{status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePdf(cpr.id)}
                            disabled={isLoading}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium disabled:opacity-50 flex items-center gap-1"
                            title="Baixar minuta completa em PDF"
                          >
                            <Download className="h-3.5 w-3.5" /> PDF
                          </button>
                          <button
                            onClick={() => handleDocument(cpr.id)}
                            disabled={isLoading}
                            className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-medium disabled:opacity-50 flex items-center gap-1"
                            title="Ver / imprimir minuta"
                          >
                            <FileText className="h-3.5 w-3.5" /> Prévia
                          </button>
                          {cpr.status !== 'RASCUNHO' && (
                            <button
                              onClick={() => openSignature(cpr)}
                              disabled={isLoading}
                              className={`text-xs font-medium disabled:opacity-50 flex items-center gap-1 ${
                                cpr.signatureStatus === 'ASSINADA'
                                  ? 'text-teal-600 hover:text-teal-800 dark:text-teal-400'
                                  : 'text-violet-600 hover:text-violet-800 dark:text-violet-400'
                              }`}
                              title="Assinatura eletrônica"
                            >
                              <PenLine className="h-3.5 w-3.5" />
                              {cpr.signatureStatus === 'ASSINADA'
                                ? 'Assinada'
                                : cpr.signatureStatus === 'PARCIAL'
                                  ? 'Assinar (1/2)'
                                  : 'Assinar'}
                            </button>
                          )}
                          {cpr.status === 'RASCUNHO' && (
                            <button
                              onClick={() => handleEmit(cpr.id)}
                              disabled={isLoading}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium disabled:opacity-50 flex items-center gap-1"
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3" />}
                              Emitir
                            </button>
                          )}
                          {['RASCUNHO', 'EMITIDA'].includes(cpr.status) && (
                            <button
                              onClick={() => handleDelete(cpr.id)}
                              disabled={isLoading}
                              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                              title="Cancelar CPR"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Modal / Drawer de criação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div
            className="relative h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header do drawer */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
              <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nova CPR completa</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dados comerciais, jurídicos, garantias e registro em uma única minuta</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="h-5 w-5 text-gray-500" />
              </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all" style={{ width: `${completeness}%` }} />
                </div>
                <span className="min-w-24 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400">{completeness}% preenchido</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Finalidade */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Finalidade</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(['EMISSAO', 'CAPTACAO'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, purpose: p }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.purpose === p
                          ? p === 'EMISSAO'
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                            : 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {p === 'EMISSAO' ? 'Emissão de CPR' : 'Captação de Crédito'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {p === 'EMISSAO'
                          ? 'Emite uma CPR física ou financeira'
                          : 'Usa a CPR como garantia para captar crédito'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo de CPR</label>
                  <select value={form.type} onChange={set('type')} className={inputClass}>
                    <option value="FINANCEIRA">CPR Financeira (liquidação em dinheiro)</option>
                    <option value="FISICA">CPR Física (entrega do produto)</option>
                  </select>
                </div>
              </section>

              <Divider />

              {/* Emitente */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Emitente (Produtor Rural)</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Nome completo *" value={form.emitenteNome} onChange={set('emitenteNome')} required /></div>
                  <Field label="CPF / CNPJ *" value={form.emitenteCpfCnpj} onChange={setMasked('emitenteCpfCnpj', maskCpfCnpj)} onBlur={() => lookupCnpj('emitente')} required placeholder="000.000.000-00" inputMode="numeric" />
                  <Field label="Número CAR" value={form.emitenteCarNumero} onChange={set('emitenteCarNumero')} placeholder="SP-XXXXXXX-XXXX..." />
                  <div className="sm:col-span-2"><Field label="Qualificação do emitente" value={form.emitenteQualificacao} onChange={set('emitenteQualificacao')} placeholder="Nacionalidade, estado civil, profissão ou dados societários" /></div>
                  <div className="sm:col-span-2"><Field label="Endereço completo" value={form.emitenteEndereco} onChange={set('emitenteEndereco')} placeholder="Rua, número, complemento e bairro" /></div>
                  <Field label="CEP" value={form.emitenteCep} onChange={set('emitenteCep')} placeholder="00000-000" inputMode="numeric" />
                  <Field label="Representante legal" value={form.emitenteRepresentante} onChange={set('emitenteRepresentante')} placeholder="Nome e qualificação" />
                  <Field label="E-mail (envio + token de autenticação)" value={form.emitenteEmail} onChange={set('emitenteEmail')} type="email" placeholder="email@exemplo.com" />
                  <Field label="Telefone / WhatsApp" value={form.emitenteTelefone} onChange={setMasked('emitenteTelefone', maskPhone)} placeholder="(11) 99999-9999" inputMode="tel" />
                  <Field label="Cidade" value={form.emitenteCidade} onChange={set('emitenteCidade')} />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Estado</label>
                    <select value={form.emitenteEstado} onChange={set('emitenteEstado')} className={inputClass}>
                      <option value="">Selecione...</option>
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40 sm:col-span-2">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Dados bancários para liberação (opcional)</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Banco" value={form.emitenteBanco} onChange={set('emitenteBanco')} />
                      <Field label="Agência" value={form.emitenteAgencia} onChange={set('emitenteAgencia')} />
                      <Field label="Conta" value={form.emitenteConta} onChange={set('emitenteConta')} />
                    </div>
                  </div>
                </div>
              </section>

              <Divider />

              {/* Credor */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Credor</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label="Nome *" value={form.credorNome} onChange={set('credorNome')} required /></div>
                  <Field label="CPF / CNPJ *" value={form.credorCpfCnpj} onChange={setMasked('credorCpfCnpj', maskCpfCnpj)} onBlur={() => lookupCnpj('credor')} required placeholder="00.000.000/0000-00" inputMode="numeric" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
                    <select value={form.credorTipo} onChange={set('credorTipo')} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="banco">Banco</option>
                      <option value="cooperativa">Cooperativa</option>
                      <option value="pessoa_fisica">Pessoa Física</option>
                      <option value="pessoa_juridica">Pessoa Jurídica</option>
                      <option value="fundo">Fundo de Investimento</option>
                    </select>
                  </div>
                  <Field label="E-mail (envio + token de autenticação)" value={form.credorEmail} onChange={set('credorEmail')} type="email" placeholder="email@exemplo.com" />
                  <Field label="Telefone / WhatsApp" value={form.credorTelefone} onChange={set('credorTelefone')} placeholder="(11) 99999-9999" />
                  <div className="sm:col-span-2"><Field label="Qualificação do credor" value={form.credorQualificacao} onChange={set('credorQualificacao')} placeholder="Natureza jurídica, registro e representação" /></div>
                  <div className="sm:col-span-2"><Field label="Endereço completo" value={form.credorEndereco} onChange={set('credorEndereco')} placeholder="Rua, número, complemento e bairro" /></div>
                  <Field label="Cidade" value={form.credorCidade} onChange={set('credorCidade')} />
                  <Field label="UF" value={form.credorEstado} onChange={set('credorEstado')} placeholder="UF" />
                  <Field label="CEP" value={form.credorCep} onChange={set('credorCep')} placeholder="00000-000" inputMode="numeric" />
                  <Field label="Representante legal" value={form.credorRepresentante} onChange={set('credorRepresentante')} />
                </div>
              </section>

              <Divider />

              {/* Produto */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Produto Agrícola</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Produto *</label>
                    <select value={form.produto} onChange={set('produto')} className={inputClass} required>
                      <option value="">Selecione...</option>
                      {['Soja','Milho','Café','Algodão','Cana-de-açúcar','Arroz','Feijão','Trigo','Boi Gordo','Frango','Suíno','Leite','Outro'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Quantidade *" value={form.quantidade} onChange={set('quantidade')} required type="number" placeholder="0" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Unidade *</label>
                    <select value={form.unidade} onChange={set('unidade')} className={inputClass} required>
                      {['sacas','toneladas','arrobas','litros','kg','caixas','unidades'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <Field label="Preço unitário (R$)" value={form.precoUnitario} onChange={set('precoUnitario')} type="number" placeholder="0,00" />
                  <Field label="Valor de face da CPR (R$) *" value={form.valorFace} onChange={set('valorFace')} type="number" placeholder="0,00" required />
                  <Field label="Qualidade do produto" value={form.produtoQualidade} onChange={set('produtoQualidade')} placeholder="Umidade, pureza, tipo..." />
                  <Field label="Padrão / classificação" value={form.produtoPadrao} onChange={set('produtoPadrao')} placeholder="Padrão comercial ou técnico" />
                  <Field label="Índice de preço" value={form.indicePreco} onChange={set('indicePreco')} placeholder="Ex.: indicador CEPEA" />
                  <Field label="Fonte do preço" value={form.fontePreco} onChange={set('fontePreco')} placeholder="Fonte verificável" />
                  <div className="sm:col-span-2"><Field label="Mercado / praça de referência" value={form.mercadoReferencia} onChange={set('mercadoReferencia')} /></div>
                  <div className="sm:col-span-2"><Field label="Propriedade / local de produção" value={form.propriedadeNome} onChange={set('propriedadeNome')} placeholder="Nome da fazenda ou unidade produtiva" /></div>
                  <div className="sm:col-span-2"><Field label="Endereço da produção" value={form.propriedadeEndereco} onChange={set('propriedadeEndereco')} /></div>
                  <Field label="Matrícula do imóvel" value={form.propriedadeMatricula} onChange={set('propriedadeMatricula')} />
                  <Field label="Local de entrega" value={form.localEntrega} onChange={set('localEntrega')} />
                  {form.type === 'FISICA' && (
                    <Field label="Data de entrega" value={form.dataEntrega} onChange={set('dataEntrega')} type="date" />
                  )}
                </div>
              </section>

              <Divider />

              {/* Vencimento / Prazo / Carência / Safras */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Prazo & Safras</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Data de vencimento *" value={form.dataVencimento} onChange={set('dataVencimento')} required type="date" />
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Prazo (até 15 anos)</label>
                    <select value={form.prazoAnos} onChange={onPrazoChange} className={inputClass}>
                      <option value="">Selecione...</option>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(a => (
                        <option key={a} value={a}>{a} {a === 1 ? 'ano' : 'anos'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Carência (máx. {carenciaMaxAnos} {carenciaMaxAnos === 1 ? 'ano' : 'anos'})
                    </label>
                    <select value={form.carenciaAnos} onChange={set('carenciaAnos')} className={inputClass}>
                      <option value="">Sem carência</option>
                      {Array.from({ length: carenciaMaxAnos }, (_, i) => i + 1).map(a => (
                        <option key={a} value={a}>{a} {a === 1 ? 'ano' : 'anos'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Safras conforme o prazo */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    Safras
                    {prazoAnosNum > 0
                      ? <span className="text-gray-400"> — selecione {prazoAnosNum} ({form.safras.length}/{prazoAnosNum})</span>
                      : <span className="text-gray-400"> — selecione o prazo primeiro</span>}
                  </label>
                  {prazoAnosNum === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                      Escolha o prazo acima para liberar a seleção de safras.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {SAFRA_OPTIONS.map(s => {
                        const active = form.safras.includes(s);
                        const full = !active && form.safras.length >= prazoAnosNum;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSafra(s)}
                            disabled={full}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : full
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <Divider />

              <section>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Condições financeiras</h3>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Campos não informados aparecem como pendentes na minuta; nenhum valor é presumido como zero.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Finalidade dos recursos</label>
                    <select value={form.finalidade} onChange={set('finalidade')} className={inputClass}>
                      <option value="">Selecione...</option>
                      <option value="custeio">Custeio agrícola</option>
                      <option value="investimento">Investimento</option>
                      <option value="giro">Capital de giro</option>
                      <option value="comercializacao">Comercialização</option>
                    </select>
                  </div>
                  <Field label="Valor a captar (R$)" value={form.valorCaptacao} onChange={set('valorCaptacao')} type="number" placeholder="0,00" />
                  <Field label="Crédito bruto (R$)" value={form.valorCredito} onChange={set('valorCredito')} type="number" placeholder="0,00" />
                  <Field label="IOF informado (R$)" value={form.valorIof} onChange={set('valorIof')} type="number" placeholder="0,00" />
                  <Field label="Valor líquido (R$)" value={form.valorLiquido} onChange={set('valorLiquido')} type="number" placeholder="0,00" />
                  <Field label="Taxa mensal (%)" value={form.taxaJurosMensal} onChange={set('taxaJurosMensal')} type="number" placeholder="0,00" />
                  <Field label="Taxa anual (%)" value={form.taxaJurosAnual} onChange={set('taxaJurosAnual')} type="number" placeholder="0,00" />
                  <Field label="CET mensal (%)" value={form.cetMensal} onChange={set('cetMensal')} type="number" placeholder="0,00" />
                  <Field label="CET anual (%)" value={form.cetAnual} onChange={set('cetAnual')} type="number" placeholder="0,00" />
                  <Field label="Multa por mora (%)" value={form.multaMoraPct} onChange={set('multaMoraPct')} type="number" placeholder="Preencher se contratada" />
                  <Field label="Juros de mora (% a.m.)" value={form.jurosMoraMensalPct} onChange={set('jurosMoraMensalPct')} type="number" placeholder="Preencher se contratado" />
                  <div className="sm:col-span-2"><Field label="Demais encargos de inadimplemento" value={form.encargosAdicionais} onChange={set('encargosAdicionais')} placeholder="Despesas comprovadas, índice de atualização ou outra condição expressa" /></div>
                  <Field label="Forma de liquidação" value={form.formaLiquidacao} onChange={set('formaLiquidacao')} placeholder="Transferência, entrega física..." />
                  <Field label="Local de pagamento / liquidação" value={form.localPagamento} onChange={set('localPagamento')} />
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Cronograma de liquidação</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Se não houver parcelas, o PDF usará o vencimento final e o valor de face.</p>
                    </div>
                    <button type="button" onClick={addInstallment} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-300">
                      <Plus className="h-3.5 w-3.5" /> Adicionar parcela
                    </button>
                  </div>
                  {form.cronograma.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {form.cronograma.map((item, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Parcela {index + 1}</span>
                            <button type="button" onClick={() => removeInstallment(index)} className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" aria-label={`Remover parcela ${index + 1}`}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Field label="Vencimento" value={item.vencimento} onChange={event => updateInstallment(index, 'vencimento', event.target.value)} type="date" />
                            <Field label="Principal (R$)" value={item.principal} onChange={event => updateInstallment(index, 'principal', event.target.value)} type="number" placeholder="0,00" />
                            <Field label="Encargos (R$)" value={item.encargos} onChange={event => updateInstallment(index, 'encargos', event.target.value)} type="number" placeholder="0,00" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <Divider />

              <section>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Garantias e aval</h3>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Use estes campos também na emissão: a garantia faz parte do título quando contratada.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo de garantia</label>
                    <select value={form.garantiaTipo} onChange={set('garantiaTipo')} className={inputClass}>
                      <option value="">Sem garantia adicional</option>
                      <option value="imovel_rural">Hipoteca / imóvel rural</option>
                      <option value="penhor_safra">Penhor rural / de safra</option>
                      <option value="alienacao_fiduciaria">Alienação fiduciária</option>
                      <option value="cessao_fiduciaria">Cessão fiduciária</option>
                      <option value="aval">Aval</option>
                      <option value="seguro">Seguro agrícola</option>
                      <option value="recebiveis">Recebíveis</option>
                    </select>
                  </div>
                  <Field label="Valor da garantia (R$)" value={form.garantiaValor} onChange={set('garantiaValor')} type="number" placeholder="0,00" />
                  <div className="sm:col-span-2"><Field label="Descrição completa da garantia" value={form.garantiaDescricao} onChange={set('garantiaDescricao')} placeholder="Bem, localização, características e vínculo com a operação" /></div>
                  <Field label="Proprietário / garantidor" value={form.garantiaProprietario} onChange={set('garantiaProprietario')} />
                  <Field label="Matrícula / registro" value={form.garantiaRegistro} onChange={set('garantiaRegistro')} />
                  <Field label="Grau / prioridade" value={form.garantiaGrau} onChange={set('garantiaGrau')} placeholder="Ex.: primeiro grau" />
                </div>

                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Avalista / garantidor pessoal (opcional)</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Nome completo" value={form.avalistaNome} onChange={set('avalistaNome')} />
                    <Field label="CPF / CNPJ" value={form.avalistaCpfCnpj} onChange={setMasked('avalistaCpfCnpj', maskCpfCnpj)} inputMode="numeric" />
                    <Field label="Qualificação" value={form.avalistaQualificacao} onChange={set('avalistaQualificacao')} />
                    <Field label="Endereço" value={form.avalistaEndereco} onChange={set('avalistaEndereco')} />
                  </div>
                </div>
              </section>

              <Divider />

              <section>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">Emissão, registro e foro</h3>
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">A ConectCampo acompanha o status. O comprovante oficial continua sendo emitido pela registradora ou cartório competente.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Local de emissão" value={form.localEmissao} onChange={set('localEmissao')} />
                  <Field label="Data de emissão" value={form.dataEmissao} onChange={set('dataEmissao')} type="date" />
                  <Field label="Registradora / entidade" value={form.registradora} onChange={set('registradora')} placeholder="B3, CERC ou outra aplicável" />
                  <Field label="Número do registro" value={form.numeroRegistro} onChange={set('numeroRegistro')} placeholder="Preencher após registro" />
                  <Field label="Cidade do foro" value={form.foroCidade} onChange={set('foroCidade')} />
                  <Field label="UF do foro" value={form.foroEstado} onChange={set('foroEstado')} placeholder="UF" />
                </div>
              </section>

              {/* Observações */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={set('observacoes')}
                  rows={3}
                  className={inputClass}
                  placeholder="Informações adicionais..."
                />
              </div>

              {/* Custo de emissão — CPR Física (pagamento único) */}
              {form.purpose === 'EMISSAO' && form.type === 'FISICA' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Custo de emissão da CPR Física</p>
                  <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                    <strong>{formatCurrency(pricing.fisicaFlat)}</strong> · pagamento único
                  </p>
                </div>
              )}

              {/* Emissão Financeira — 0,8% sobre o valor de face */}
              {form.purpose === 'EMISSAO' && form.type === 'FINANCEIRA' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Custo de emissão da CPR Financeira</p>
                  {form.valorFace ? (
                    <p className="text-emerald-600 dark:text-emerald-500 mt-1">
                      <strong>{formatCurrency(parseFloat(form.valorFace) * (pricing.financeiraRatePct / 100))}</strong>
                      {' '}· {pricing.financeiraRatePct}% do valor de face ({formatCurrency(parseFloat(form.valorFace))})
                    </p>
                  ) : (
                    <p className="text-emerald-600 dark:text-emerald-500 mt-1">{pricing.financeiraRatePct}% sobre o valor de face · informe o valor de face para calcular</p>
                  )}
                </div>
              )}

              {/* Captação — Fee ConectCampo 6% */}
              {form.purpose === 'CAPTACAO' && form.precoUnitario && form.quantidade && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                  <p className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Valor estimado</p>
                  <p className="text-amber-600 dark:text-amber-500 mt-1">
                    Total: <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario))}</strong>
                    {' '}· Fee ConectCampo ({pricing.captacaoFeeRatePct}%): <strong>{formatCurrency(parseFloat(form.quantidade) * parseFloat(form.precoUnitario) * (pricing.captacaoFeeRatePct / 100))}</strong>
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {error}
                </p>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar CPR
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal de assinatura eletrônica */}
      {signModal && (
        <Modal title="Assinatura eletrônica" onClose={() => setSignModal(null)} maxWidth="max-w-lg">
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A ZapSign envia o link individual por e-mail quando o endereço está preenchido e exige
                o token recebido para autenticar a parte. Os links também ficam disponíveis abaixo para
                compartilhamento manual. Ao assinar, registramos data, status e o hash do documento.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {signModal.info.provider === 'zapsign' ? 'Assinatura via ZapSign' : 'Assinatura interna'}
              </div>

              {([
                { who: 'emitente', label: 'Emitente', party: signModal.info.emitente },
                { who: 'credor', label: 'Credor', party: signModal.info.credor },
              ] as const).map(({ who, label, party }) => (
                <div key={who} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{party.nome}</p>
                    </div>
                    {party.signedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                        <CheckCircle2 className="h-4 w-4" /> Assinado em {new Date(party.signedAt).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="h-4 w-4" /> Pendente
                      </span>
                    )}
                  </div>
                  {!party.signedAt && (
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={partyUrl(party)}
                        className="flex-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-gray-600 dark:text-gray-300 truncate"
                      />
                      <button
                        onClick={() => copyLink(party, who)}
                        className="flex items-center gap-1 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-3 py-2"
                      >
                        <Copy className="h-3.5 w-3.5" /> {copied === who ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {signModal.info.signatureStatus === 'ASSINADA' && (
                <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 p-3 text-sm text-teal-700 dark:text-teal-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> CPR totalmente assinada.
                  </div>
                  <button
                    onClick={() => downloadSigned(signModal.cpr.id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-2"
                  >
                    <FileText className="h-3.5 w-3.5" /> Baixar PDF assinado
                  </button>
                </div>
              )}

              {signModal.info.documentHash && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 break-all">
                  Hash SHA-256: {signModal.info.documentHash}
                </p>
              )}

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => resetSignature(signModal.cpr.id)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  Gerar novos links
                </button>
                <button
                  onClick={() => setSignModal(null)}
                  className="text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputClass =
  'w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors';

function Field({
  label, value, onChange, onBlur, required, type = 'text', placeholder, inputMode,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'search' | 'url' | 'none';
}) {
  return (
    <div>
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        step={type === 'number' ? 'any' : undefined}
        className={inputClass}
      />
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-800" />;
}
