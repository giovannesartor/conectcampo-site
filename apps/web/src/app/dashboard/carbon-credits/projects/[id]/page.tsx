'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  ChevronRight,
  BarChart2,
  Award,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  DollarSign,
  Trash2,
  TreePine,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface Inventory {
  id: string;
  year: number;
  measuredEmissions: number;
  baselineEmissions: number;
  netReduction: number;
  creditsEligible: number;
  leakage: number;
  buffer: number;
  verifiedBy: string | null;
}

interface Transaction {
  id: string;
  type: string;
  quantity: number;
  pricePerCredit: number | null;
  totalValue: number | null;
  buyerName: string | null;
  transactionDate: string;
}

interface Credit {
  id: string;
  vintage: number;
  quantity: number;
  status: string;
  pricePerCredit: number | null;
  totalValue: number | null;
  issuedAt: string | null;
  retiredAt: string | null;
  transactions: Transaction[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  projectType: string;
  standard: string;
  state: string;
  city: string;
  eligibleAreaHa: number;
  totalAreaHa: number;
  baselineEmissions: number;
  projectedReduction: number;
  projectDurationYears: number;
  estimatedCreditPrice: number | null;
  totalEstimatedRevenue: number | null;
  verificationBody: string | null;
  createdAt: string;
  inventories: Inventory[];
  credits: Credit[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:          { label: 'Rascunho',      color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  IN_VALIDATION:  { label: 'Em Validação',  color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30' },
  VALIDATED:      { label: 'Validado',      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  REGISTERED:     { label: 'Registrado',    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
  MONITORING:     { label: 'Monitorando',   color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' },
  VERIFIED:       { label: 'Verificado',    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  ACTIVE:         { label: 'Ativo',         color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  COMPLETED:      { label: 'Concluído',     color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  CANCELLED:      { label: 'Cancelado',     color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
};

const CREDIT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Pendente',    color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  ISSUED:      { label: 'Emitido',     color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  RETIRED:     { label: 'Aposentado',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  TRANSFERRED: { label: 'Transferido', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
  CANCELLED:   { label: 'Cancelado',   color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
};

const TX_LABELS: Record<string, string> = {
  ISSUANCE:     'Emissão',
  SALE:         'Venda',
  RETIREMENT:   'Aposentadoria',
  TRANSFER:     'Transferência',
  CANCELLATION: 'Cancelamento',
};

export default function CarbonProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Inventory form
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [invForm, setInvForm] = useState({ year: new Date().getFullYear(), measuredEmissions: '', leakage: '0', buffer: '0', methodology: '', verifiedBy: '' });
  const [invLoading, setInvLoading] = useState(false);

  // Issue credits form
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueForm, setIssueForm] = useState({ vintage: new Date().getFullYear(), quantity: '', pricePerCredit: '' });
  const [issueLoading, setIssueLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/carbon-credits/projects/${id}`);
      setProject(r.data);
    } catch {
      router.push('/dashboard/carbon-credits/projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddInventory(e: React.FormEvent) {
    e.preventDefault();
    setInvLoading(true);
    try {
      await api.post(`/carbon-credits/projects/${id}/inventories`, {
        year: invForm.year,
        measuredEmissions: Number(invForm.measuredEmissions),
        baselineEmissions: Number(project?.baselineEmissions ?? 0),
        leakage: Number(invForm.leakage),
        buffer: Number(invForm.buffer),
        methodology: invForm.methodology || undefined,
        verifiedBy: invForm.verifiedBy || undefined,
      });
      setShowInventoryForm(false);
      load();
    } catch { /* ignore */ } finally { setInvLoading(false); }
  }

  async function handleIssueCredits(e: React.FormEvent) {
    e.preventDefault();
    setIssueLoading(true);
    try {
      await api.post(`/carbon-credits/projects/${id}/credits/issue`, {
        vintage: issueForm.vintage,
        quantity: Number(issueForm.quantity),
        pricePerCredit: issueForm.pricePerCredit ? Number(issueForm.pricePerCredit) : undefined,
      });
      setShowIssueForm(false);
      load();
    } catch { /* ignore */ } finally { setIssueLoading(false); }
  }

  async function handleUpdateStatus(status: string) {
    try {
      await api.patch(`/carbon-credits/projects/${id}/status`, { status });
      load();
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  const statusCfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.DRAFT;
  const totalCredits = project.credits.reduce((s, c) => s + (c.status === 'ISSUED' ? Number(c.quantity) : 0), 0);
  const totalRetired = project.credits.reduce((s, c) => s + (c.status === 'RETIRED' ? Number(c.quantity) : 0), 0);
  const totalRevenue = project.credits.reduce((s, c) => s + Number(c.totalValue ?? 0), 0);

  const canIssueCredits = ['VALIDATED','REGISTERED','MONITORING','VERIFIED','ACTIVE'].includes(project.status);

  const nextStatuses: Record<string, string[]> = {
    DRAFT:         ['IN_VALIDATION'],
    IN_VALIDATION: ['VALIDATED', 'CANCELLED'],
    VALIDATED:     ['REGISTERED'],
    REGISTERED:    ['MONITORING'],
    MONITORING:    ['VERIFIED'],
    VERIFIED:      ['ACTIVE', 'ISSUING_CREDITS'],
    ACTIVE:        ['COMPLETED', 'SUSPENDED'],
    SUSPENDED:     ['ACTIVE', 'CANCELLED'],
  };
  const transitions = nextStatuses[project.status] ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 flex-wrap">
          <Link href="/dashboard/carbon-credits" className="hover:text-emerald-600">Carbono</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/carbon-credits/projects" className="hover:text-emerald-600">Projetos</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{project.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{project.description}</p>
            )}
          </div>
          {transitions.length > 0 && (
            <div className="flex gap-2 shrink-0">
              {transitions.slice(0, 2).map((s) => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  className="btn-secondary text-xs"
                >
                  → {STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500">Área Elegível</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{Number(project.eligibleAreaHa).toLocaleString('pt-BR')} ha</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">CO₂ Reduzido/ano</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{Number(project.projectedReduction).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} t</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Créditos Emitidos</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{totalCredits.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500">Receita Gerada</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventários */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              Inventário de Emissões
            </h2>
            <button
              onClick={() => setShowInventoryForm(!showInventoryForm)}
              className="btn-secondary text-xs"
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </button>
          </div>

          {showInventoryForm && (
            <form onSubmit={handleAddInventory} className="mb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Ano</label>
                  <input
                    type="number" min="2000" max="2100"
                    value={invForm.year}
                    onChange={(e) => setInvForm({ ...invForm, year: Number(e.target.value) })}
                    className="input text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Emissões Medidas (tCO₂e)</label>
                  <input
                    type="number" min="0" step="0.0001" required
                    value={invForm.measuredEmissions}
                    onChange={(e) => setInvForm({ ...invForm, measuredEmissions: e.target.value })}
                    className="input text-sm mt-1"
                    placeholder="Ex: 200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Leakage (tCO₂e)</label>
                  <input type="number" min="0" step="0.0001"
                    value={invForm.leakage}
                    onChange={(e) => setInvForm({ ...invForm, leakage: e.target.value })}
                    className="input text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Buffer (tCO₂e)</label>
                  <input type="number" min="0" step="0.0001"
                    value={invForm.buffer}
                    onChange={(e) => setInvForm({ ...invForm, buffer: e.target.value })}
                    className="input text-sm mt-1"
                  />
                </div>
              </div>
              <input
                type="text"
                value={invForm.methodology}
                onChange={(e) => setInvForm({ ...invForm, methodology: e.target.value })}
                className="input text-sm w-full"
                placeholder="Metodologia (ex: VM0017)"
              />
              <input
                type="text"
                value={invForm.verifiedBy}
                onChange={(e) => setInvForm({ ...invForm, verifiedBy: e.target.value })}
                className="input text-sm w-full"
                placeholder="Verificador (ex: Bureau Veritas)"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowInventoryForm(false)} className="btn-secondary text-xs">Cancelar</button>
                <button type="submit" disabled={invLoading} className="btn-primary text-xs">
                  {invLoading ? 'Salvando...' : 'Salvar Inventário'}
                </button>
              </div>
            </form>
          )}

          {project.inventories.length === 0 ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
              Nenhum inventário registrado ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {project.inventories.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-dark-border">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.year}</p>
                    <p className="text-xs text-gray-500">
                      Redução líq.: <strong className="text-emerald-600">{Number(inv.creditsEligible).toFixed(2)} tCO₂e</strong> elegíveis
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Medido: {Number(inv.measuredEmissions).toFixed(2)}</p>
                    <p>Base: {Number(inv.baselineEmissions).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Créditos */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Créditos de Carbono
            </h2>
            {canIssueCredits && (
              <button
                onClick={() => setShowIssueForm(!showIssueForm)}
                className="btn-primary text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Emitir
              </button>
            )}
          </div>

          {!canIssueCredits && project.credits.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 flex gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                O projeto precisa estar Validado ou Registrado para emitir créditos.
              </p>
            </div>
          )}

          {showIssueForm && (
            <form onSubmit={handleIssueCredits} className="mb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Vintage (Ano)</label>
                  <input
                    type="number" min="2000" max="2100" required
                    value={issueForm.vintage}
                    onChange={(e) => setIssueForm({ ...issueForm, vintage: Number(e.target.value) })}
                    className="input text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Quantidade (tCO₂e)</label>
                  <input
                    type="number" min="0.0001" step="0.0001" required
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    className="input text-sm mt-1"
                    placeholder="Ex: 1000"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Preço por crédito (R$/tCO₂e)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={issueForm.pricePerCredit}
                  onChange={(e) => setIssueForm({ ...issueForm, pricePerCredit: e.target.value })}
                  className="input text-sm mt-1"
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowIssueForm(false)} className="btn-secondary text-xs">Cancelar</button>
                <button type="submit" disabled={issueLoading} className="btn-primary text-xs">
                  {issueLoading ? 'Emitindo...' : 'Emitir Créditos'}
                </button>
              </div>
            </form>
          )}

          {project.credits.length === 0 ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
              Nenhum crédito emitido ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {project.credits.map((c) => {
                const cfg = CREDIT_STATUS[c.status] ?? CREDIT_STATUS.PENDING;
                return (
                  <div key={c.id} className="p-3 rounded-lg border border-gray-100 dark:border-dark-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Vintage {c.vintage}</p>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Number(c.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} tCO₂e
                          {c.pricePerCredit && ` · R$ ${Number(c.pricePerCredit).toFixed(2)}/t`}
                          {c.totalValue && ` · ${formatCurrency(Number(c.totalValue))}`}
                        </p>
                      </div>
                    </div>
                    {c.transactions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-2 text-xs text-gray-400 pl-2 border-l-2 border-gray-100 dark:border-dark-border">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{TX_LABELS[tx.type] ?? tx.type}</span>
                            <span>{Number(tx.quantity).toFixed(2)} tCO₂e</span>
                            {tx.buyerName && <span>→ {tx.buyerName}</span>}
                            {tx.totalValue && <span>{formatCurrency(Number(tx.totalValue))}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {(totalCredits > 0 || totalRetired > 0) && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><span className="font-medium text-emerald-600">{totalCredits.toFixed(2)}</span> tCO₂e disponíveis</div>
              <div><span className="font-medium text-blue-600">{totalRetired.toFixed(2)}</span> tCO₂e aposentados</div>
            </div>
          )}
        </div>
      </div>

      {/* Detalhes técnicos */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TreePine className="h-5 w-5 text-green-600" />
          Detalhes Técnicos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-gray-500">Área Total</p><p className="font-medium">{Number(project.totalAreaHa).toLocaleString('pt-BR')} ha</p></div>
          <div><p className="text-xs text-gray-500">Baseline</p><p className="font-medium">{Number(project.baselineEmissions).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e/ano</p></div>
          <div><p className="text-xs text-gray-500">Duração</p><p className="font-medium">{project.projectDurationYears} anos</p></div>
          <div><p className="text-xs text-gray-500">Verificador</p><p className="font-medium">{project.verificationBody ?? '—'}</p></div>
        </div>
        {project.totalEstimatedRevenue && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-emerald-600">Receita Total Estimada (projeto completo)</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(Number(project.totalEstimatedRevenue))}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
