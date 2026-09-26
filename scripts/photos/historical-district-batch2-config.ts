import type { HistoricalBatchConfig } from "./historical-district-batch1-core";

export const historicalBatch2Districts = [
  "sile",
  "maltepe",
  "sisli",
  "catalca",
] as const;

export const historicalBatch2Config: HistoricalBatchConfig = {
  name: "historical-district-photos-batch2",
  label: "Historical Batch 2",
  districts: historicalBatch2Districts,
  envPrefix: "PRODUCTION_HISTORICAL_PHOTO_BATCH2",
  requireExistingCollection: true,
};
