"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { DURATION, EASE_OUT } from "@/lib/motion";

type UndoBannerProps = {
  message: string;
  onUndo: () => void;
};

export function UndoBanner({ message, onUndo }: UndoBannerProps) {
  return (
    <motion.div
      role="status"
      className="fixed bottom-6 left-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-xl px-5 py-3.5 flex items-center gap-4"
      initial={{ opacity: 0, y: 16, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 16, x: "-50%" }}
      transition={{ duration: DURATION.enter, ease: EASE_OUT }}
    >
      <span className="text-sm">{message}</span>
      <Button
        size="sm"
        variant="ghost"
        className="text-white hover:bg-white/10 hover:text-white"
        onClick={onUndo}
      >
        Undo
      </Button>
    </motion.div>
  );
}
