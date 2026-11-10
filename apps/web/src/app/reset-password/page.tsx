"use client";

import { AuthShell } from "@/components/experience/AuthShell";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Token inválido ou expirado. Solicite um novo link.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Link inválido ou expirado.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-block">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <CheckCircle className="h-16 w-16 text-brand-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Senha redefinida!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Você será redirecionado para o login em instantes...
      </p>
      <Link href="/login" className="btn-primary inline-block">
        Ir para o login
      </Link>
    </div>
  ) : (
    <>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Criar nova senha
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Escolha uma senha forte com no mínimo 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-10"
              placeholder="Mínimo 8 caracteres"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="label">
            Confirmar nova senha
          </label>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Repita a senha"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Um novo acesso."
      accent="A mesma conexão."
      description="Defina sua nova senha para continuar acompanhando sua operação."
    >
      <Suspense fallback={<p className="text-gray-500">Carregando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
