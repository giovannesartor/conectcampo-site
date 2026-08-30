'use client';

import { useState } from 'react';
import { PublicLayout } from '@/components/landing/PublicLayout';
import { Mail, MessageSquare, Building2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const contacts = [
  { icon: Mail, label: 'E-mail geral', value: 'contato@conectcampo.com.br', href: 'mailto:contato@conectcampo.com.br' },
  { icon: Building2, label: 'Parcerias institucionais', value: 'parcerias@conectcampo.com.br', href: 'mailto:parcerias@conectcampo.com.br' },
  { icon: MessageSquare, label: 'Suporte', value: 'suporte@conectcampo.com.br', href: 'mailto:suporte@conectcampo.com.br' },
];

export default function ContatoPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/leads', {
        name: form.name,
        email: form.email,
        source: `contato: ${form.subject}`,
      });
      setSent(true);
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente mais tarde.');
    } finally {
      setSending(false);
    }
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-white dark:from-dark-card dark:to-dark-bg px-6 py-20 lg:px-8 text-center">
        <span className="inline-block rounded-full bg-brand-100 dark:bg-brand-900/30 px-4 py-1.5 text-sm font-medium text-brand-700 dark:text-brand-400 mb-6">
          Contato
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Fale com a <span className="text-brand-600">ConectCampo</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Dúvidas, parcerias, imprensa ou suporte — nosso time está pronto para te atender.
        </p>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contact info */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Canais de contato</h2>
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-5 py-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20 shrink-0">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Enviar mensagem</h2>
            {sent ? (
              <div className="rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white mb-4">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Mensagem enviada!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nossa equipe analisará sua mensagem e retornará pelo e-mail informado.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <label className="label">E-mail</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                      placeholder="joao@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Assunto</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="input"
                    placeholder="Ex: Quero ser parceiro"
                  />
                </div>
                <div>
                  <label className="label">Mensagem</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input resize-none"
                    placeholder="Conte o que você precisa..."
                  />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                  {sending ? 'Enviando...' : 'Enviar mensagem'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
