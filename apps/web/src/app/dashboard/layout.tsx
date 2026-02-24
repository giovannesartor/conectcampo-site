'use client';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { PreviewContextProvider } from '@/lib/preview-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PreviewContextProvider>
      <DashboardShell>{children}</DashboardShell>
    </PreviewContextProvider>
  );
}
