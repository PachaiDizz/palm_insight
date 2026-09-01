/**
 * Trigger a file download from a Blob.
 * Uses URL.createObjectURL for clean resource management.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Trigger a file download from a string content.
 */
export function downloadString(content: string, filename: string, mimeType: string = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Build a CSV string from rows, escaping commas, quotes and newlines so the
 * output stays valid regardless of cell content.
 */
export function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escapeCell = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
