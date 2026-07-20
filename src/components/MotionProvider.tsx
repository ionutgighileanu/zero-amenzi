"use client";

import { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Respectă prefers-reduced-motion pentru toate animațiile motion:
 * transform/layout sunt dezactivate, opacity rămâne (crossfade).
 * Animațiile CSS sunt oprite separat, în globals.css.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
