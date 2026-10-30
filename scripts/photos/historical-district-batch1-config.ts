import type { HistoricalBatchConfig } from "./historical-district-photo-engine";

export const historicalBatch1Districts = [
  "bakirkoy",
  "besiktas",
  "beyoglu",
  "eyupsultan",
  "fatih",
  "kagithane",
  "sariyer",
  "adalar",
  "beykoz",
  "kadikoy",
  "uskudar",
] as const;

export const historicalBatch1Config: HistoricalBatchConfig = {
  name: "historical-district-photos-batch1",
  label: "Historical Batch 1",
  districts: historicalBatch1Districts,
  envPrefix: "PRODUCTION_HISTORICAL_PHOTO_BATCH1",
  requireExistingCollection: false,
};
