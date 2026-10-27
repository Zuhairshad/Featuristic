/** Bounds for the v1 CSV-only importer. Every limit is enforced on the server, never only in the UI. */
export const IMPORT_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxRows: 10_000,
  maxColumns: 100,
  maxCellLength: 10_000,
  maxKeyColumns: 10,
  batchSize: 100,
  previewErrorLimit: 50,
  previewSampleRows: 5,
} as const;

export const UPLOAD_BUCKET = "import-uploads";
export const QUEUE_NAME = "import_center_jobs";
