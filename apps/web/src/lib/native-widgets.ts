import { Capacitor, registerPlugin } from '@capacitor/core';
import { api } from './api';

const Widgets = registerPlugin<{
  setSession(options: { session: string }): Promise<void>;
  sync(options: { session: string; snapshot: string }): Promise<void>;
  clear(): Promise<void>;
}>('ConectCampoWidgets');

export type WidgetPreferences = { agendaEnabled: boolean; farmId: string | null };
export type WidgetFarm = { id: string; name: string; city: string; state: string; latitude: number | null; longitude: number | null };
export type WidgetContext = { generatedAt: string; days: Array<{ date: string; count: number }>; farms: WidgetFarm[] };
export const WIDGET_PREFERENCES_CHANGED = 'conectcampo:widget-preferences';
const defaults: WidgetPreferences = { agendaEnabled: false, farmId: null };
let activeSession: string | null = null;
let nativeSession = '';
let revision = 0;
let sessionWrite: Promise<void> = Promise.resolve();
let inFlight: { revision: number; userId: string; promise: Promise<boolean> } | null = null;
let lastSync: { userId: string; at: number } | null = null;

export function supportsNativeWidgets() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('ConectCampoWidgets');
}

export function readWidgetPreferences(userId: string): WidgetPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(`conectcampo.widgets.${userId}`) ?? 'null');
    return { agendaEnabled: value?.agendaEnabled === true, farmId: typeof value?.farmId === 'string' ? value.farmId : null };
  } catch { return { ...defaults }; }
}

export async function saveWidgetPreferences(userId: string, value: WidgetPreferences) {
  localStorage.setItem(`conectcampo.widgets.${userId}`, JSON.stringify(value));
  revision += 1;
  lastSync = null;
  const savedRevision = revision;
  const session = nativeSession;
  if (supportsNativeWidgets() && activeSession === userId) {
    await sessionWrite;
    if (activeSession !== userId || revision !== savedRevision) return;
    // Immediately remove the old private summary, even if the following fetch is offline.
    await Widgets.sync({ session, snapshot: JSON.stringify({ agendaEnabled: false, location: null, days: [], updatedAt: Date.now() / 1000 }) });
  }
  window.dispatchEvent(new Event(WIDGET_PREFERENCES_CHANGED));
}

export function hasWidgetCoordinates(farm: WidgetFarm) {
  return typeof farm.latitude === 'number' && Number.isFinite(farm.latitude) && Math.abs(farm.latitude) <= 90
    && typeof farm.longitude === 'number' && Number.isFinite(farm.longitude) && Math.abs(farm.longitude) <= 180;
}

export async function setNativeWidgetSession(userId: string | null) {
  if (!supportsNativeWidgets()) return;
  if (!userId) return clearNativeWidgets();
  if (activeSession === userId) return sessionWrite;
  activeSession = userId;
  lastSync = null;
  nativeSession = crypto.randomUUID();
  const session = nativeSession;
  revision += 1;
  // Serialize identity changes; an older request must never restore a signed-out account.
  sessionWrite = sessionWrite.catch(() => undefined).then(() => Widgets.setSession({ session }));
  await sessionWrite;
}

export async function clearNativeWidgets() {
  activeSession = null;
  lastSync = null;
  nativeSession = '';
  revision += 1;
  if (!supportsNativeWidgets()) return;
  sessionWrite = sessionWrite.catch(() => undefined).then(() => Widgets.clear());
  await sessionWrite;
}

export function syncNativeWidgets(userId: string, force = false): Promise<boolean> {
  if (!supportsNativeWidgets() || activeSession !== userId) return Promise.resolve(false);
  if (inFlight?.revision === revision && inFlight.userId === userId) return inFlight.promise;
  if (!force && lastSync?.userId === userId && Date.now() - lastSync.at < 60000) return Promise.resolve(true);
  const current = { revision, userId, promise: performSync(userId) };
  inFlight = current;
  void current.promise.finally(() => { if (inFlight === current) inFlight = null; }).catch(() => undefined);
  return current.promise;
}

async function performSync(userId: string): Promise<boolean> {
  if (!supportsNativeWidgets() || activeSession !== userId) return false;
  const requestRevision = revision;
  const session = nativeSession;
  const preferences = readWidgetPreferences(userId);
  await sessionWrite;
  if (activeSession !== userId || requestRevision !== revision) return false;
  // With both private features disabled, no personal context needs to be requested.
  const context = preferences.agendaEnabled || preferences.farmId
    ? (await api.get<WidgetContext>('/widgets/context')).data
    : { farms: [], days: [] };
  if (activeSession !== userId || requestRevision !== revision) return false;
  const farm = context.farms.find(item => item.id === preferences.farmId && hasWidgetCoordinates(item));
  const snapshot = {
    agendaEnabled: preferences.agendaEnabled,
    location: farm ? { latitude: farm.latitude, longitude: farm.longitude, label: `${farm.city} / ${farm.state}`.slice(0, 80) } : null,
    days: preferences.agendaEnabled ? context.days.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isSafeInteger(day.count) && day.count >= 0 && day.count < 100000).slice(0, 31).map(({ date, count }) => ({ date, count })) : [],
    updatedAt: Date.now() / 1000,
  };
  // No cookies, access/refresh tokens, event titles, amounts or farm names cross this bridge.
  await Widgets.sync({ session, snapshot: JSON.stringify(snapshot) });
  const current = activeSession === userId && requestRevision === revision;
  if (current) lastSync = { userId, at: Date.now() };
  return current;
}
