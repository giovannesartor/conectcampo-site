import type { ReactNode } from "react";
import { FieldVisual } from "./FieldVisual";

export function PageHero({ children }: { children: ReactNode }) {
  return (
    <section className="cc-page-hero">
      <div className="cc-container cc-page-hero-content">{children}</div>
      <FieldVisual />
    </section>
  );
}
