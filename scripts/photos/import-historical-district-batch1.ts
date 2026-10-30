/** Verified Historical Batch 1 importer. Defaults to a read-only dry-run. */
import {
  reportHistoricalImporterError,
  runHistoricalImporter,
} from "./historical-district-photo-importer";
import { historicalBatch1Config } from "./historical-district-batch1-config";

runHistoricalImporter({
  batchConfig: historicalBatch1Config,
  defaultManifest: "data/districts/historical-photo-batch1.json",
  downloadDirectory: "/tmp/historical-district-photos",
}).catch((error) =>
  reportHistoricalImporterError(error, historicalBatch1Config),
);
