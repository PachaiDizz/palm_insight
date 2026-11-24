import type { Plantation } from "@/types";

export interface FieldGroupProps {
  /** Raw string values for this job type's detail fields. */
  value: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, string>;
  /** Plants list — used by MEMBAJA for the block multi-select. */
  plantations?: Plantation[];
  primaryPlantationId?: string;
  /** Previously typed contractors (MEMBAJA only). */
  contractorSuggestions?: string[];
}
