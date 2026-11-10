"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import "./experience.css";
import "./public.css";

export function PublicSurface({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="cc-home cc-public">{children}</div>
    </MotionConfig>
  );
}
