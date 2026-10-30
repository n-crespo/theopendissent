/**
 * Tiny global toast store. Callable from anywhere (components, hooks, lib) and
 * rendered by <Toaster />. Only one toast is shown at a time: a new toast
 * replaces the current one.
 */

export type ToastType = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  action?: ToastAction;
  /** ms before auto-dismiss; Infinity keeps it until dismissed */
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
  duration: number;
}

type Listener = (toast: ToastItem | null) => void;

let current: ToastItem | null = null;
let nextId = 1;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l(current));

const defaultDuration = (type: ToastType, hasAction: boolean) =>
  hasAction ? 6000 : type === "error" ? 5500 : 3500;

const show = (type: ToastType, opts: ToastOptions | string) => {
  const o = typeof opts === "string" ? { title: opts } : opts;
  current = {
    ...o,
    id: nextId++,
    type,
    duration: o.duration ?? defaultDuration(type, !!o.action),
  };
  emit();
  return current.id;
};

export const toast = {
  success: (opts: ToastOptions | string) => show("success", opts),
  error: (opts: ToastOptions | string) => show("error", opts),
  info: (opts: ToastOptions | string) => show("info", opts),
  /** dismiss the given toast, or whatever is showing if no id is passed */
  dismiss: (id?: number) => {
    if (!current || (id !== undefined && current.id !== id)) return;
    current = null;
    emit();
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    listener(current);
    return () => {
      listeners.delete(listener);
    };
  },
};
