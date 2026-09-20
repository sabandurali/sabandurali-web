/** Production PostgreSQL district importer. Never defaults to write mode. */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  createLocalReq,
  getPayload,
  type Payload,
  type PayloadRequest,
} from "payload";
import {
  describeProductionDatabase,
  readProductionMigrationState,
} from "../vercel-build.mjs";
import { attachEditorial, type EditorialBundle } from "./editorial";
import { validateBundle, type ResearchBundle } from "./import-core";
import {
  applyProductionImport,
  assertProductionImportEnvironment,
  productionDryRunConfigurationStatus,
  productionImportError,
  readProductionImportPlan,
  safeProductionImportErrorCategory,
  type ProductionImportErrorCategory,
  type ProductionImportDocument,
  type ProductionImportRepository,
  type ProductionImportTransaction,
} from "./production-import-core";

function databaseErrorCategory(error: unknown): ProductionImportErrorCategory {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";
  if (code === "28P01" || code === "28000") return "authentication_failed";
  if (
    new Set([
      "ECONNREFUSED",
      "ECONNRESET",
      "ENETUNREACH",
      "ENOTFOUND",
      "ETIMEDOUT",
    ]).has(code)
  ) {
    return "connection_failed";
  }
  return "query_failed";
}

function payloadTransaction(
  instance: Payload,
  req: PayloadRequest,
): ProductionImportTransaction {
  return {
    async findDistricts() {
      const result = await instance.find({
        collection: "district-guides",
        depth: 0,
        draft: true,
        fallbackLocale: false,
        limit: 100,
        locale: "tr",
        overrideAccess: true,
        req,
      });
      return result.docs as unknown as ProductionImportDocument[];
    },
    async updateDistrict(id, data) {
      return (await instance.update({
        collection: "district-guides",
        data,
        draft: true,
        id,
        locale: "tr",
        overrideAccess: true,
        req,
      })) as unknown as ProductionImportDocument;
    },
  };
}

function payloadRepository(payload: Payload): ProductionImportRepository {
  return {
    async readDistricts() {
      const req = await createLocalReq(
        { fallbackLocale: false, locale: "tr" },
        payload,
      );
      return payloadTransaction(payload, req).findDistricts();
    },
    async transaction(operation) {
      const req = await createLocalReq(
        { fallbackLocale: false, locale: "tr" },
        payload,
      );
      const transactionID = await payload.db.beginTransaction({
        accessMode: "read write",
        isolationLevel: "serializable",
      });
      if (!transactionID) {
        throw productionImportError(
          "transaction_failed",
          "PostgreSQL transaction could not be started.",
        );
      }
      req.transactionID = transactionID;
      try {
        const result = await operation(payloadTransaction(payload, req));
        await payload.db.commitTransaction(transactionID);
        delete req.transactionID;
        return result;
      } catch (error) {
        try {
          await payload.db.rollbackTransaction(transactionID);
        } catch {
          throw productionImportError(
            "rollback_failed",
            "Production district import rollback failed closed.",
          );
        } finally {
          delete req.transactionID;
        }
        throw error;
      }
    },
  };
}

async function main(): Promise<void> {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        apply: { type: "boolean" },
        "dry-run": { type: "boolean" },
        editorial: {
          type: "string",
          default: "data/districts/editorial.json",
        },
        input: { type: "string", default: "data/districts/research.json" },
      },
      strict: true,
    }));
  } catch {
    throw productionImportError(
      "configuration_failed",
      "Production importer arguments are invalid.",
    );
  }

  if (values.apply === values["dry-run"]) {
    throw productionImportError(
      "configuration_failed",
      "Choose exactly one of --dry-run or --apply.",
    );
  }

  const apply = values.apply === true;
  assertProductionImportEnvironment(process.env, apply);

  // Shared fingerprint validation plus a live current_database() check happen
  // in a READ ONLY transaction before Payload can initialize a write path.
  try {
    describeProductionDatabase(process.env.DATABASE_URL!);
  } catch {
    throw productionImportError(
      "fingerprint_failed",
      "Production database fingerprint does not match.",
    );
  }

  let migrationState;
  try {
    migrationState = await readProductionMigrationState(process.env);
  } catch (error) {
    throw productionImportError(
      databaseErrorCategory(error),
      "Production database verification query failed.",
    );
  }
  if (
    migrationState.pendingMigrationNames.length !== 0 ||
    migrationState.appliedCount !== migrationState.registeredCount
  ) {
    throw productionImportError(
      "schema_mismatch",
      "Production migration state is not current.",
    );
  }

  let bundle: ResearchBundle;
  try {
    bundle = JSON.parse(
      await readFile(values.input!, "utf8"),
    ) as ResearchBundle;
    validateBundle(bundle);
    attachEditorial(
      bundle,
      JSON.parse(await readFile(values.editorial!, "utf8")) as EditorialBundle,
    );
  } catch {
    throw productionImportError(
      "input_failed",
      "District import input validation failed.",
    );
  }

  let payload: Payload;
  try {
    const { default: configPromise } = await import("../../src/payload.config");
    const config = await configPromise;
    config.typescript.autoGenerate = false;
    payload = await getPayload({ config });
  } catch {
    throw productionImportError(
      "initialization_failed",
      "Payload production initialization failed.",
    );
  }
  try {
    const repository = payloadRepository(payload);
    const plan = apply
      ? await applyProductionImport(bundle, repository)
      : await readProductionImportPlan(bundle, repository);
    console.log(
      JSON.stringify(apply ? { ...plan.count, writes: plan.count.update } : plan.count),
    );
  } finally {
    await payload.destroy();
  }
}

main().catch((error) => {
  // Driver errors can contain connection details. Production failures stay
  // intentionally opaque so credentials never reach terminal logs.
  const category = safeProductionImportErrorCategory(error);
  console.error(
    JSON.stringify({
      error: category,
      ...(category === "configuration_failed" || category === "approval_failed"
        ? { configuration: productionDryRunConfigurationStatus(process.env) }
        : {}),
    }),
  );
  process.exitCode = 1;
});
