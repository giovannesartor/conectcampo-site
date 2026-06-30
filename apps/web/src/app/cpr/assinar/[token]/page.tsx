'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { PenLine, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

// Cliente próprio (sem o interceptor que redireciona para /login em 401),
// pois esta é uma página pública acessada por token.
const pub = axios.create({ baseURL: '/api/v1' });

interface SignView {
  party: 'emitente' | 'credor';
  partyName: string;
  counterpartyName: string;
  numeroCpr: string | null;
  signatureStatus: string;
  documentHash: string | null;
  alreadySigned: boolean;
  signedAt: string | null;
  html: string;
}

export default function AssinarCprPage() {
  const params = useParams();
  const token = String(params?.token ?? '');

  const [view, setView] = useState<SignView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [consent, setConsent] = useState(false);
  const [nome, setNome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    pub
      .get<SignView>(`/cpr/sign/${token}`)
      .then(({ data }) => {
        setView(data);
        setDone(data.alreadySigned);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    setSubmitting(true);
    setError('');
    try {
      await pub.post(`/cpr/sign/${token}`, { nomeConfirmacao: nome });
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Não foi possível assinar. Verifique o nome digitado.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (notFound || !view) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h1 className="text-lg font-semibold text-gray-900">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-500 mt-1">Solicite um novo link de assinatura ao emissor da CPR.</p>
      </div>
    );
  }

  const partyLabel = view.party === 'emitente' ? 'Emitente' : 'Credor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-gradient-to-r from-brand-800 to-brand-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-extrabold text-lg tracking-tight">
            ConectCampo<span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-200">Assinatura de CPR</span>
          </div>
          {view.numeroCpr && <span className="text-xs text-brand-200">Nº {view.numeroCpr}</span>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-violet-700">
            <PenLine className="h-5 w-5" />
            <h1 className="text-base font-semibold text-gray-900">
              Você está assinando como <span className="text-violet-700">{partyLabel}</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {view.partyName} · contraparte: {view.counterpartyName}
          </p>
        </div>

        {/* Documento (minuta) */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-500">
            Documento a assinar
          </div>
          <iframe
            title="Minuta da CPR"
            srcDoc={view.html}
            className="w-full"
            style={{ height: 520, border: 'none', background: '#fff' }}
          />
        </div>

        {done ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-center">
            <CheckCircle2 className="h-10 w-10 text-teal-600 mx-auto" />
            <h2 className="mt-2 text-lg font-semibold text-teal-800">Assinatura registrada</h2>
            <p className="text-sm text-teal-700 mt-1">
              {view.signatureStatus === 'ASSINADA' || done
                ? 'Obrigado. Sua assinatura foi registrada com sucesso.'
                : 'Sua assinatura foi registrada.'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p>
                Assinatura eletrônica simples (Lei nº 14.063/2020). Ao assinar, você declara concordância
                com o conteúdo do documento. Registramos data, hora, IP e o hash do documento como trilha
                de auditoria. Este ato não substitui o registro em cartório quando exigido.
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Confirme seu nome completo</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={view.partyName}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 accent-emerald-600" />
              Li e concordo com o conteúdo da Cédula de Produto Rural acima.
            </label>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <button
              onClick={handleSign}
              disabled={!consent || !nome.trim() || submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Assinar documento
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 pb-6">
          ConectCampo · Assinatura eletrônica com trilha de auditoria
        </p>
      </main>
    </div>
  );
}
