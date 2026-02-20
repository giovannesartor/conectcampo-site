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
                { icon: '📄', title: 'Envie documentos', desc: 'Documentos completos aumentam a confiabilidade do seu perfil.' },
                { icon: '🌾', title: 'Registre produção', desc: 'Histórico de produção consistente melhora seu score.' },
                { icon: '🛡️', title: 'Contrate seguro', desc: 'Seguro agrícola ativo demonstra gestão de risco.' },
                { icon: '💰', title: 'Mantenha receita', desc: 'Receita estável e crescente é altamente valorizada.' },
                { icon: '📊', title: 'Reduza dívidas', desc: 'Menor endividamento = melhor score.' },
                { icon: '🏦', title: 'Bom histórico', desc: 'Pague operações anteriores em dia.' },
              ].map((tip, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <p className="text-lg mb-1">{tip.icon}</p>
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
