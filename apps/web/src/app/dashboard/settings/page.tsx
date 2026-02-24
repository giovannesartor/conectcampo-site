'use client';

import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { User, Lock, Bell, Save, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    proposals: true,
    operations: true,
    scoring: true,
    marketing: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', { name, phone });
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Erro ao alterar senha. Verifique a senha atual.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotification(key: keyof typeof notifications) {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    setSavingNotifications(true);
    try {
      await api.patch('/users/me', { notificationPreferences: updated });
    } catch {
      // revert on error
      setNotifications(notifications);
      toast.error('Erro ao salvar preferência.');
    } finally {
      setSavingNotifications(false);
    }
  }

  const tabs = [
    { key: 'profile', label: 'Perfil', icon: User },
    { key: 'password', label: 'Senha', icon: Lock },
    { key: 'notifications', label: 'Notificações', icon: Bell },
  ] as const;

  const NOTIFICATION_ITEMS = [
    { label: 'Novas propostas', desc: 'Receber email quando uma proposta for recebida', key: 'proposals' as const },
    { label: 'Atualizações de operação', desc: 'Quando o status de uma operação mudar', key: 'operations' as const },
    { label: 'Score atualizado', desc: 'Quando seu score for recalculado', key: 'scoring' as const },
    { label: 'Novidades da plataforma', desc: 'Newsletter e atualizações', key: 'marketing' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-dark-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                tab === t.key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card max-w-lg space-y-4">
          <div>
            <label className="label">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="label">Função</label>
            <input
              type="text"
              value={user?.role || ''}
              disabled
              className="input opacity-60 cursor-not-allowed"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="card max-w-lg space-y-4">
          <div>
            <label className="label">Senha Atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pr-10"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Nova Senha</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="label">Confirmar Nova Senha</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              autoComplete="new-password"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {saving ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      )}

      {/* Notifications tab */}
      {tab === 'notifications' && (
        <div className="card max-w-lg space-y-1">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Preferências de notificação por email</p>
            {savingNotifications && (
              <span className="text-xs text-gray-400">Salvando...</span>
            )}
          </div>
          {NOTIFICATION_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-border last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotification(item.key)}
                disabled={savingNotifications}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  notifications[item.key] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications[item.key] ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
