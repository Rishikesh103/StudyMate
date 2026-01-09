import { useState, useEffect } from "react";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: "default" | "destructive";
};

// Simple event emitter for toasts
const listeners: Set<(toast: Toast) => void> = new Set();

function emit(toast: Toast) {
  listeners.forEach((listener) => listener(toast));
}

export function useToast() {
  const toast = ({ title, description, variant = "default" }: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    emit({ id: Date.now(), title, description, variant });
  };
  return { toast };
}

// Internal hook for the Toaster component
export function useToastListener() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToast: Toast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3000);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return toasts;
}
