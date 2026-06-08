'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Leaf, Info } from 'lucide-react';
import { api } from '@/lib/api';

const PROJECT_TYPES = [
  { value: 'FLORESTA_NATIVA',     label: '🌳 Floresta Nativa',                  desc: 'Preservação ou restauração de floresta nativa' },
  { value: 'REFLORESTATION',      label: '🌱 Reflorestamento',                  desc: 'Plantio de mudas em áreas degradadas' },
  { value: 'PASTAGEM_RECUPERADA', label: '🐄 Pastagem Recuperada',              desc: 'Recuperação de pastagens degradadas com sequestro de carbono' },
  { value: 'INTEGRACAO_LAVOURA',  label: '🌿 ILPF',                            desc: 'Integração lavoura-pecuária-floresta' },
  { value: 'AGRICULTURA_CARBONO', label: '🚜 Agricultura Baixo Carbono',         desc: 'Programa ABC+ e práticas de baixo carbono' },
  { value: 'BIODIGESTAO',         label: '♻️ Biodigestão',                     desc: 'Biodigestores e geração de biogás' },
  { value: 'ENERGIA_RENOVAVEL',   label: '☀️ Energia Renovável',               desc: 'Solar, eólico e outras renováveis na propriedade' },
  { value: 'MANEJO_SOLO',         label: '🌾 Manejo de Solo',                   desc: 'Plantio direto e práticas de conservação do solo' },
  { value: 'OUTRO',               label: '📋 Outro',                           desc: 'Outros tipos de projeto' },
];

const STANDARDS = [
  { value: 'VERRA_VCS',        label: 'Verra VCS',          desc: 'Verified Carbon Standard — mais usado no agro' },
  { value: 'GOLD_STANDARD',    label: 'Gold Standard',      desc: 'Foco em co-benefícios socioambientais' },
  { value: 'CERRADO_PROTOCOL', label: 'Protocolo Cerrado',  desc: 'Específico para bioma Cerrado' },
  { value: 'AMAZON_FUND',      label: 'Fundo Amazônia',     desc: 'Projetos na Amazônia Legal' },
  { value: 'REDD_PLUS',        label: 'REDD+',              desc: 'Redução de emissões por desmatamento' },
  { value: 'CAR_REGISTRY',     label: 'Registro CAR',       desc: 'Cadastro Ambiental Rural' },
  { value: 'OUTRO',            label: 'Outro / A definir',  desc: 'Padrão a ser definido com verificador' },
];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

interface FormData {
  name: string;
  description: string;
  projectType: string;
  standard: string;
  state: string;
  city: string;
  totalAreaHa: string;
  eligibleAreaHa: string;
  baselineEmissions: string;
  projectedReduction: string;
  projectDurationYears: string;
  verificationBody: string;
  estimatedCreditPrice: string;
}

export default function NewCarbonProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    projectType: '',
    standard: '',
    state: '',
    city: '',
    totalAreaHa: '',
    eligibleAreaHa: '',
    baselineEmissions: '',
    projectedReduction: '',
    projectDurationYears: '20',
    verificationBody: '',
    estimatedCreditPrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedRevenue =
    form.projectedReduction && form.estimatedCreditPrice && form.projectDurationYears
      ? Number(form.projectedReduction) * Number(form.estimatedCreditPrice) * Number(form.projectDurationYears)
      : null;

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/carbon-credits/projects', {
        name: form.name,
        description: form.description || undefined,
        projectType: form.projectType,
        standard: form.standard,
        state: form.state,
        city: form.city,
        totalAreaHa: Number(form.totalAreaHa),
        eligibleAreaHa: Number(form.eligibleAreaHa),
        baselineEmissions: Number(form.baselineEmissions),
        projectedReduction: Number(form.projectedReduction),
        projectDurationYears: Number(form.projectDurationYears),
        verificationBody: form.verificationBody || undefined,
        estimatedCreditPrice: form.estimatedCreditPrice ? Number(form.estimatedCreditPrice) : undefined,
      });
      router.push('/dashboard/carbon-credits/projects');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar projeto'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/carbon-credits" className="hover:text-emerald-600">Carbono</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/carbon-credits/projects" className="hover:text-emerald-600">Projetos</Link>
          <ChevronRight className="h-4 w-4" />
          <span>Novo Projeto</span>
        </div>
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Projeto de Carbono</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Identificação */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-dark-border pb-3">
            1. Identificação do Projeto
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input"
              placeholder="Ex: Reflorestamento Fazenda Santa Fé"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Descreva o projeto, práticas adotadas e impactos esperados..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Projeto *
              </label>
              <select
                required
                value={form.projectType}
                onChange={(e) => handleChange('projectType', e.target.value)}
                className="input"
              >
                <option value="">Selecione...</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {form.projectType && (
                <p className="text-xs text-gray-400 mt-1">
                  {PROJECT_TYPES.find((t) => t.value === form.projectType)?.desc}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Padrão de Certificação *
              </label>
              <select
                required
                value={form.standard}
                onChange={(e) => handleChange('standard', e.target.value)}
                className="input"
              >
                <option value="">Selecione...</option>
                {STANDARDS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {form.standard && (
                <p className="text-xs text-gray-400 mt-1">
                  {STANDARDS.find((s) => s.value === form.standard)?.desc}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado *</label>
              <select
                required
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="input"
              >
                <option value="">Selecione...</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Município *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="input"
                placeholder="Nome do município"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Dados Técnicos */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-dark-border pb-3">
            2. Dados Técnicos e de Baseline
          </h2>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              O baseline representa as emissões que ocorreriam sem o projeto. Os créditos gerados = baseline − emissões medidas − leakage − buffer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Área Total do Projeto (ha) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.totalAreaHa}
                onChange={(e) => handleChange('totalAreaHa', e.target.value)}
                className="input"
                placeholder="Ex: 500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Área Elegível para Crédito (ha) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.eligibleAreaHa}
                onChange={(e) => handleChange('eligibleAreaHa', e.target.value)}
                className="input"
                placeholder="Ex: 400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emissões Baseline (tCO₂e/ano) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.0001"
                value={form.baselineEmissions}
                onChange={(e) => handleChange('baselineEmissions', e.target.value)}
                className="input"
                placeholder="Ex: 1200.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Redução Projetada (tCO₂e/ano) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.0001"
                value={form.projectedReduction}
                onChange={(e) => handleChange('projectedReduction', e.target.value)}
                className="input"
                placeholder="Ex: 1000.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duração do Projeto (anos)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.projectDurationYears}
                onChange={(e) => handleChange('projectDurationYears', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entidade Verificadora
              </label>
              <input
                type="text"
                value={form.verificationBody}
                onChange={(e) => handleChange('verificationBody', e.target.value)}
                className="input"
                placeholder="Ex: Bureau Veritas, DNV"
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Financeiro */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-dark-border pb-3">
            3. Projeção Financeira
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preço Estimado por Crédito (R$/tCO₂e)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedCreditPrice}
              onChange={(e) => handleChange('estimatedCreditPrice', e.target.value)}
              className="input"
              placeholder="Ex: 60.00"
            />
            <p className="text-xs text-gray-400 mt-1">
              Referência de mercado: R$ 50–125/crédito dependendo do padrão e tipo de projeto.
            </p>
          </div>

          {estimatedRevenue !== null && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Receita Total Estimada</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {estimatedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-emerald-500 mt-1">
                {form.projectedReduction} tCO₂e/ano × R$ {form.estimatedCreditPrice}/crédito × {form.projectDurationYears} anos
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/carbon-credits/projects" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Criando...
              </span>
            ) : (
              <>
                <Leaf className="h-4 w-4 mr-2" />
                Criar Projeto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
