'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="overview"]',
    title: 'Bem-vindo ao Dashboard!',
    content: 'Aqui você tem uma visão geral da sua conta, operações e status de crédito.',
    position: 'bottom',
  },
  {
    target: '[data-tour="operations"]',
    title: 'Suas Operações',
    content: 'Gerencie todas as suas solicitações de crédito. Crie novas operações e acompanhe o status.',
    position: 'right',
  },
  {
    target: '[data-tour="proposals"]',
    title: 'Propostas Recebidas',
    content: 'Veja as propostas das instituições financeiras e compare condições de crédito.',
    position: 'right',
  },
  {
    target: '[data-tour="documents"]',
    title: 'Documentos',
    content: 'Envie e gerencie toda a documentação necessária para suas operações de crédito.',
    position: 'right',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notificações',
    content: 'Fique por dentro de novas propostas, atualizações de status e alertas importantes.',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'conectcampo_tour_completed';

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Delay to allow DOM to settle
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!active) return;
    const step = TOUR_STEPS[currentStep];
    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [active, currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  function handleClose() {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  function handleNext() {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handlePrev() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  if (!active) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10001,
  };

  const pad = 12;
  switch (step.position) {
    case 'bottom':
      tooltipStyle.top = position.top + position.height + pad;
      tooltipStyle.left = position.left;
      break;
    case 'right':
      tooltipStyle.top = position.top;
      tooltipStyle.left = position.left + position.width + pad;
      break;
    case 'left':
      tooltipStyle.top = position.top;
      tooltipStyle.right = window.innerWidth - position.left + pad;
      break;
    case 'top':
    default:
      tooltipStyle.top = position.top - pad;
      tooltipStyle.left = position.left;
      tooltipStyle.transform = 'translateY(-100%)';
      break;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[10000]"
        onClick={handleClose}
      />

      {/* Highlight */}
      <div
        className="absolute z-[10001] rounded-lg ring-4 ring-brand-500 ring-offset-4 ring-offset-white dark:ring-offset-gray-900 pointer-events-none transition-all duration-300"
        style={{
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        style={tooltipStyle}
        className="w-80 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-2xl p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {step.title}
            </h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {currentStep + 1} de {TOUR_STEPS.length}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
            >
              {isLast ? 'Concluir' : 'Próximo'}
              {!isLast && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
