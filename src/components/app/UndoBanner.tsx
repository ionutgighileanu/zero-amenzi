"use client";

import { Button } from "@/components/ui/Button";

type UndoBannerProps = {
  message: string;
  onUndo: () => void;
};

export function UndoBanner({ message, onUndo }: UndoBannerProps) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-xl px-5 py-3.5 flex items-center gap-4"
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
    </div>
  );
}
