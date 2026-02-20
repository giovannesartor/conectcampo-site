'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingDown, Clock, DollarSign } from 'lucide-react';

const TERM_OPTIONS = [
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
  { value: 24, label: '24 meses' },
  { value: 36, label: '36 meses' },
  { value: 48, label: '48 meses' },
  { value: 60, label: '60 meses' },
];

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function CreditSimulator() {
  const [amount, setAmount] = useState(500000);
  const [term, setTerm] = useState(24);

  const result = useMemo(() => {
    const annualRate = 0.105; // 10.5% a.a. (taxa média crédito rural)
    const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
    const monthlyPayment =
      (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    const totalPaid = monthlyPayment * term;
    const totalInterest = totalPaid - amount;

    return { monthlyPayment, totalPaid, totalInterest, monthlyRate, annualRate };
  }, [amount, term]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-16 mx-auto max-w-2xl"
    >
      <div className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/80 backdrop-blur-lg p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Simulador de Crédito Rural
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Estimativa com taxa média de mercado · 10,5% a.a.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Amount */}
          <div>
            <label className="label mb-2 block">Quanto precisa?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                R$
              </span>
              <input
                type="range"
                min={50000}
                max={5000000}
                step={50000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mb-2 accent-brand-600"
              />
              <div className="text-center text-xl font-bold text-gray-900 dark:text-white">
                {formatBRL(amount)}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>R$ 50 mil</span>
                <span>R$ 5 mi</span>
              </div>
            </div>
          </div>

          {/* Term */}
          <div>
            <label className="label mb-2 block">Qual prazo?</label>
            <div className="grid grid-cols-3 gap-2">
              {TERM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTerm(opt.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    term === opt.value
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 dark:bg-dark-bg p-4">
          <div className="text-center">
            <DollarSign className="h-5 w-5 text-brand-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatBRL(result.monthlyPayment)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Parcela estimada</p>
          </div>
          <div className="text-center">
            <TrendingDown className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {(result.annualRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taxa anual</p>
          </div>
          <div className="text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatBRL(result.totalPaid)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total a pagar</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          * Simulação ilustrativa. Taxa e condições variam conforme análise de crédito e instituição
          financeira parceira.
        </p>
      </div>
    </motion.div>
  );
}
