export interface FieldGroupProps {
  /** Raw string values for this job type's detail fields. */
  value: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, string>;
  /** MEMBAJA only: worker count lives in the common form state. */
  workerCount?: number;
  onWorkerCountChange?: (n: number) => void;
  /** Previously typed contractors (MEMBAJA only). */
  contractorSuggestions?: string[];
}
