/** Verified Historical Batch 2 importer. Defaults to a read-only dry-run. */
import {
  reportHistoricalImporterError,
  runHistoricalImporter,
} from "./import-historical-district-batch1";
import { historicalBatch2Config } from "./historical-district-batch2-config";

runHistoricalImporter({
  batchConfig: historicalBatch2Config,
  defaultManifest: "data/districts/historical-photo-batch2.json",
  downloadDirectory: "/tmp/historical-district-photos-batch2",
}).catch((error) => reportHistoricalImporterError(error, historicalBatch2Config));
