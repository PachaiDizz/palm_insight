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
