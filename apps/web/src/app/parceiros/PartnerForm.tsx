'use client';

import { useState, FormEvent } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

const PARTNER_TYPES = [
  'Banco',
  'Cooperativa de Crédito',
  'FIDC / Securitizadora',
  'FIAGRO',
  'Fintech',
  'Outro',
];

export function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Cadastro enviado com sucesso!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Nosso time comercial entrará em contato em até 24h úteis.
          Fique atento ao seu e-mail.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 sm:p-8 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="partnerName" className="label mb-1.5 block">
            Nome da instituição *
          </label>
          <input
            id="partnerName"
            type="text"
            required
            placeholder="Ex: Banco Agro S.A."
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="partnerType" className="label mb-1.5 block">
            Tipo de instituição *
          </label>
          <select
            id="partnerType"
            required
            defaultValue=""
            className="input w-full"
          >
            <option value="" disabled>
              Selecione
            </option>
            {PARTNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="contactName" className="label mb-1.5 block">
            Nome do responsável *
          </label>
          <input
            id="contactName"
            type="text"
            required
            placeholder="Nome completo"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="contactRole" className="label mb-1.5 block">
            Cargo
          </label>
          <input
            id="contactRole"
            type="text"
            placeholder="Ex: Diretor de Crédito"
            className="input w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="partnerEmail" className="label mb-1.5 block">
            E-mail corporativo *
          </label>
          <input
            id="partnerEmail"
            type="email"
            required
            placeholder="contato@instituicao.com.br"
            className="input w-full"
          />
        </div>
        <div>
          <label htmlFor="partnerPhone" className="label mb-1.5 block">
            Telefone *
          </label>
          <input
            id="partnerPhone"
            type="tel"
            required
            placeholder="(11) 99999-9999"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="partnerCnpj" className="label mb-1.5 block">
          CNPJ
        </label>
        <input
          id="partnerCnpj"
          type="text"
          placeholder="00.000.000/0000-00"
          className="input w-full"
        />
      </div>

      <div>
        <label htmlFor="partnerMessage" className="label mb-1.5 block">
          Mensagem (opcional)
        </label>
        <textarea
          id="partnerMessage"
          rows={3}
          placeholder="Conte-nos sobre o interesse da sua instituição na ConectCampo..."
          className="input w-full resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Enviar cadastro
          </>
        )}
      </button>
    </form>
  );
}
