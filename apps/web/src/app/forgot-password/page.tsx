"use client";

import { AuthShell } from "@/components/experience/AuthShell";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Vamos reconectar"
      accent="você ao campo."
      description="Recupere seu acesso e retome sua operação com tranquilidade."
    >
      {sent ? (
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            E-mail enviado!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Se <strong>{email}</strong> estiver cadastrado, você receberá um
            link para redefinir sua senha em breve. Verifique também sua caixa
            de spam.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Voltar ao login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Esqueceu sua senha?
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite seu e-mail e enviaremos um link para você criar uma nova
            senha.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-medium text-brand-600 hover:text-brand-500"
              >
                Entrar
              </Link>
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
