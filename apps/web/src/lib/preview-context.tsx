'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PreviewState {
  previewRole: string | null;
  previewPlan: string | null;
}

interface PreviewContextValue extends PreviewState {
  setPreview: (role: string | null, plan: string | null) => void;
}

const PreviewContext = createContext<PreviewContextValue>({
  previewRole: null,
  previewPlan: null,
  setPreview: () => {},
});

export function PreviewContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewState>({
    previewRole: null,
    previewPlan: null,
  });

  return (
    <PreviewContext.Provider
      value={{
        ...state,
        setPreview: (role, plan) => setState({ previewRole: role, previewPlan: plan }),
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}
