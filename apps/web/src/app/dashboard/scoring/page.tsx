'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Info, RefreshCw } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { api } from '@/lib/api';

const SCORE_FACTORS = [
  { key: 'revenueScore', label: 'Receita e Faturamento', weight: 20, description: 'Baseado na receita anual declarada' },
  { key: 'guaranteesScore', label: 'Garantias', weight: 20, description: 'Avalia garantias como imóveis, safra, maquinário' },
  { key: 'productionHistoryScore', label: 'Histórico de Produção', weight: 15, description: 'Anos de atividade e consistência' },
  { key: 'debtRatioScore', label: 'Endividamento', weight: 15, description: 'Relação dívida/receita atual' },
  { key: 'cashFlowScore', label: 'Fluxo de Caixa', weight: 15, description: 'Regularidade e projeção de caixa' },
  { key: 'creditHistoryScore', label: 'Histórico de Crédito', weight: 10, description: 'Histórico com instituições financeiras' },
  { key: 'insuranceScore', label: 'Seguros', weight: 5, description: 'Cobertura de seguro agrícola' },
];

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-brand-600';
    if (s >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-brand-500';
    if (s >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${getColor(score)}`}>{score.toFixed(0)}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${getBarColor(score)}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  );
}

export default function ScoringPage() {
  const { user } = useAuth();
  const [scoring, setScoring] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadScoring();
  }, []);

  async function loadScoring() {
    try {
      const { data } = await api.get('/scoring/my-score');
      setScoring(data);
    } catch {
      // Score may not exist yet
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const { data } = await api.post('/scoring/recalculate');
      setScoring(data);
    } catch {
      // handle
    } finally {
      setRecalculating(false);
    }
  }

  const totalScore = scoring?.totalScore || 0;

  const getScoreCategory = (s: number) => {
    if (s >= 80) return { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' };
    if (s >= 60) return { label: 'Bom', color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950/30' };
    if (s >= 40) return { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30' };
    return { label: 'Baixo', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' };
  };

  const category = getScoreCategory(totalScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Score & Rating</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sua pontuação de crédito rural ConectCampo
          </p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
          Recalcular
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl lg:col-span-2" />
        </div>
      ) : !scoring ? (
        <div className="card text-center py-16">
          <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Score não calculado</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Crie uma operação de crédito para que seu score seja calculado automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score card */}
          <div className="card text-center">
            <div className={`inline-flex items-center justify-center h-32 w-32 rounded-full ${category.bg} mx-auto`}>
              <div>
                <p className={`text-4xl font-bold ${category.color}`}>{totalScore.toFixed(0)}</p>
                <p className={`text-sm font-medium ${category.color}`}>{category.label}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Escala de 0 a 100</p>
            <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Info className="h-3 w-3" />
                <span>Quanto maior, melhores condições de crédito</span>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalhamento do Score</h3>
            <div className="space-y-4">
              {SCORE_FACTORS.map((factor) => (
                <div key={factor.key}>
                  <ScoreGauge
                    score={scoring[factor.key] || 0}
                    label={`${factor.label} (${factor.weight}%)`}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Como melhorar seu score</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, title: 'Envie documentos', desc: 'Documentos completos aumentam a confiabilidade do seu perfil.' },
                { icon: <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12M12 12C12 7 7 4 2 6c4 2 6 6 10 6zM12 12C12 7 17 4 22 6c-4 2-6 6-10 6z"/></svg>, title: 'Registre produção', desc: 'Histórico de produção consistente melhora seu score.' },
                { icon: <svg className="h-5 w-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title: 'Contrate seguro', desc: 'Seguro agrícola ativo demonstra gestão de risco.' },
                { icon: <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: 'Mantenha receita', desc: 'Receita estável e crescente é altamente valorizada.' },
                { icon: <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Reduza dívidas', desc: 'Menor endividamento = melhor score.' },
                { icon: <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="10" width="18" height="11" rx="1"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>, title: 'Bom histórico', desc: 'Pague operações anteriores em dia.' },
              ].map((tip, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg flex flex-col gap-2">
                  <div>{tip.icon}</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
