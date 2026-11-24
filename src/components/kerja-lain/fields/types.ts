export interface FieldGroupProps {
  /** Raw string values for this job type's detail fields. */
  value: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors: Record<string, string>;
}
