import type { ToastData } from "@/components/ui/Toast";

export interface FieldGroupProps {
  /** Raw string values for this job type's detail fields. */
  value: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, string>;
  /** MEMBAJA only: worker count lives in the common form state. */
  workerCount?: number;
  onWorkerCountChange?: (n: number) => void;
  /** Current block/plantation, used to scope saved work options. */
  plantationId?: string | null;
  /** Surface "DISIMPAN" / error toasts when saving new dropdown options. */
  onToast?: (toast: ToastData) => void;
}
