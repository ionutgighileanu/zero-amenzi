"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type DeleteConfirmProps = {
  label: string;
  onConfirm: () => void;
};

export function DeleteConfirm({ label, onConfirm }: DeleteConfirmProps) {
  const [armed, setArmed] = useState(false);

  if (!armed)
    return (
      <button
        onClick={() => setArmed(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
      >
        <Trash2 size={15} /> {label}
      </button>
    );

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-600">Sigur?</span>
      <Button size="sm" variant="outline" onClick={() => setArmed(false)}>
        Nu
      </Button>
      <Button size="sm" variant="danger" onClick={onConfirm}>
        Da, șterge
      </Button>
    </div>
  );
}
