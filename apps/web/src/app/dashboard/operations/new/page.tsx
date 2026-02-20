'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  DollarSign,
  MapPin,
  Upload,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

const STEPS = [
  { label: 'Tipo', icon: FileText },
  { label: 'Valores', icon: DollarSign },
  { label: 'Propriedade', icon: MapPin },
  { label: 'Documentos', icon: Upload },
  { label: 'Revisão', icon: Check },
];

const OPERATION_TYPES = [
  { value: 'CPR_FINANCIAL', label: 'CPR Financeira', description: 'Cédula de Produto Rural com liquidação financeira. Ideal para custeio e investimento.' },
  { value: 'CPR_PHYSICAL', label: 'CPR Física', description: 'Cédula de Produto Rural com entrega do produto. Para quem já tem contrato de venda.' },
  { value: 'CDCA', label: 'CDCA', description: 'Certificado de Direitos Creditórios do Agro. Para cooperativas e cerealistas.' },
  { value: 'CRA', label: 'CRA', description: 'Certificado de Recebíveis do Agro. Captação via mercado de capitais.' },
  { value: 'LCA', label: 'LCA', description: 'Letra de Crédito do Agro. Linha bancária com benefício fiscal.' },
  { value: 'FIAGRO', label: 'FIAGRO', description: 'Fundo de Investimento nas Cadeias Produtivas do Agro.' },
];

const CROPS = [
  'Soja', 'Milho', 'Café', 'Algodão', 'Arroz', 'Trigo', 'Cana-de-açúcar',
  'Feijão', 'Pecuária (Corte)', 'Pecuária (Leite)', 'Fruticultura', 'Outro',
];

export default function NewOperationWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: '',
    amount: '',
    termMonths: '12',
    purpose: '',
    crop: '',
    farmName: '',
    farmLocation: '',
    farmArea: '',
    guaranteeDescription: '',
    notes: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canNext(): boolean {
    switch (step) {
      case 0: return !!form.type;
      case 1: return !!form.amount && !!form.termMonths && !!form.purpose;
      case 2: return !!form.crop && !!form.farmLocation;
      case 3: return true; // documents optional
      case 4: return true;
      default: return false;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post('/operations', {
        type: form.type,
        amount: parseFloat(form.amount.replace(/\D/g, '')) / 100,
        termMonths: parseInt(form.termMonths),
        purpose: form.purpose,
        crop: form.crop,
        farmName: form.farmName,
        farmLocation: form.farmLocation,
        farmArea: form.farmArea ? parseFloat(form.farmArea) : undefined,
        guaranteeDescription: form.guaranteeDescription,
        notes: form.notes,
      });
      router.push('/dashboard/operations');
    } catch (err) {
      console.error('Failed to create operation', err);
      alert('Erro ao criar operação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="btn-ghost flex items-center gap-2 text-sm mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nova Operação de Crédito
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Preencha as informações para solicitar uma nova operação
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 transition-all ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-border text-gray-400'
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${isDone ? 'bg-green-500' : 'bg-gray-200 dark:bg-dark-border'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        {STEPS.map((s,i) => (
          <span key={s.label} className={i === step ? 'text-brand-600 font-medium' : ''}>{s.label}</span>
        ))}
      </div>

      {/* Card */}
      <div className="card">
        {/* Step 0: Type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selecione o tipo de operação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPERATION_TYPES.map((op) => (
                <button
                  key={op.value}
                  onClick={() => update('type', op.value)}
                  className={`text-left rounded-xl border-2 p-4 transition-all ${
                    form.type === op.value
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/20'
                      : 'border-gray-200 dark:border-dark-border hover:border-brand-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{op.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{op.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Values */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Valores e prazo
            </h2>
            <div>
              <label className="label mb-1.5 block">Valor solicitado (R$) *</label>
              <input
                type="text"
                value={form.amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  const n = parseInt(v || '0') / 100;
                  update('amount', n > 0 ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
                }}
                placeholder="0,00"
                className="input w-full text-lg"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Prazo (meses) *</label>
              <select
                value={form.termMonths}
                onChange={(e) => update('termMonths', e.target.value)}
                className="input w-full"
              >
                {[6, 12, 18, 24, 36, 48, 60].map((m) => (
                  <option key={m} value={m.toString()}>{m} meses</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Finalidade *</label>
              <select
                value={form.purpose}
                onChange={(e) => update('purpose', e.target.value)}
                className="input w-full"
                defaultValue=""
              >
                <option value="" disabled>Selecione</option>
                <option value="CUSTEIO">Custeio</option>
                <option value="INVESTIMENTO">Investimento</option>
                <option value="GIRO">Capital de Giro</option>
                <option value="MERCADO_CAPITAIS">Mercado de Capitais</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Property */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações da propriedade
            </h2>
            <div>
              <label className="label mb-1.5 block">Cultura principal *</label>
              <select
                value={form.crop}
                onChange={(e) => update('crop', e.target.value)}
                className="input w-full"
              >
                <option value="" disabled>Selecione</option>
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5 block">Nome da propriedade</label>
              <input
                type="text"
                value={form.farmName}
                onChange={(e) => update('farmName', e.target.value)}
                placeholder="Ex: Fazenda Boa Esperança"
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Localização (Cidade/UF) *</label>
              <input
                type="text"
                value={form.farmLocation}
                onChange={(e) => update('farmLocation', e.target.value)}
                placeholder="Ex: Sorriso/MT"
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Área total (hectares)</label>
              <input
                type="number"
                value={form.farmArea}
                onChange={(e) => update('farmArea', e.target.value)}
                placeholder="Ex: 500"
                className="input w-full"
              />
            </div>
            <div>
              <label className="label mb-1.5 block">Garantias (opcional)</label>
              <textarea
                value={form.guaranteeDescription}
                onChange={(e) => update('guaranteeDescription', e.target.value)}
                rows={2}
                placeholder="Descreva as garantias oferecidas..."
                className="input w-full resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documentos (opcional)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Você pode enviar documentos agora ou após a criação da operação.
            </p>
            <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-border p-8 text-center">
              <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Arraste arquivos ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400">
                PDF, JPG ou PNG · Máx. 10 MB por arquivo
              </p>
              <button className="btn-ghost mt-4 text-sm">Selecionar arquivos</button>
            </div>
            <div>
              <label className="label mb-1.5 block">Observações adicionais</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                placeholder="Informações adicionais para análise..."
                className="input w-full resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revise sua operação
            </h2>
            <div className="rounded-xl bg-gray-50 dark:bg-dark-bg p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Tipo</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {OPERATION_TYPES.find((o) => o.value === form.type)?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Valor</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    R$ {form.amount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Prazo</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {form.termMonths} meses
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Finalidade</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.purpose}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Cultura</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.crop}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Localização</span>
                  <span className="font-medium text-gray-900 dark:text-white">{form.farmLocation}</span>
                </div>
                {form.farmName && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Propriedade</span>
                    <span className="font-medium text-gray-900 dark:text-white">{form.farmName}</span>
                  </div>
                )}
                {form.farmArea && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block">Área</span>
                    <span className="font-medium text-gray-900 dark:text-white">{form.farmArea} ha</span>
                  </div>
                )}
              </div>
              {form.guaranteeDescription && (
                <div className="text-sm border-t border-gray-200 dark:border-dark-border pt-3">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Garantias</span>
                  <span className="text-gray-900 dark:text-white">{form.guaranteeDescription}</span>
                </div>
              )}
              {form.notes && (
                <div className="text-sm border-t border-gray-200 dark:border-dark-border pt-3">
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">Observações</span>
                  <span className="text-gray-900 dark:text-white">{form.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="btn-ghost flex items-center gap-2 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            Próximo <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Enviar Operação
          </button>
        )}
      </div>
    </div>
  );
}
