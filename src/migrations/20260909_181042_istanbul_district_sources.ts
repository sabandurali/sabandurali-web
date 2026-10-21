import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_district_guides_reviewed_sections" AS ENUM('summary', 'history', 'geography', 'life', 'transportation', 'facts', 'neighborhoods', 'housingTexture', 'regionalAssessment', 'marketData', 'planningDevelopments', 'placesGuide', 'distinctiveFeatures', 'researchTopics');
  CREATE TYPE "public"."enum_district_guides_sources_sections" AS ENUM('summary', 'history', 'geography', 'life', 'transportation', 'facts', 'neighborhoods', 'housingTexture', 'regionalAssessment', 'marketData', 'planningDevelopments', 'placesGuide', 'distinctiveFeatures', 'researchTopics');
  CREATE TYPE "public"."enum_district_guides_sources_source_type" AS ENUM('official', 'academic', 'secondary', 'market', 'unclassified');
  CREATE TYPE "public"."enum__district_guides_v_version_reviewed_sections" AS ENUM('summary', 'history', 'geography', 'life', 'transportation', 'facts', 'neighborhoods', 'housingTexture', 'regionalAssessment', 'marketData', 'planningDevelopments', 'placesGuide', 'distinctiveFeatures', 'researchTopics');
  CREATE TYPE "public"."enum__district_guides_v_version_sources_sections" AS ENUM('summary', 'history', 'geography', 'life', 'transportation', 'facts', 'neighborhoods', 'housingTexture', 'regionalAssessment', 'marketData', 'planningDevelopments', 'placesGuide', 'distinctiveFeatures', 'researchTopics');
  CREATE TYPE "public"."enum__district_guides_v_version_sources_source_type" AS ENUM('official', 'academic', 'secondary', 'market', 'unclassified');
  ALTER TYPE "public"."enum_district_guides_planning_developments_status" ADD VALUE 'ihale' BEFORE 'uygulama';
  ALTER TYPE "public"."enum_district_guides_planning_developments_status" ADD VALUE 'insaat' BEFORE 'uygulama';
  ALTER TYPE "public"."enum_district_guides_planning_developments_status" ADD VALUE 'belirsiz';
  ALTER TYPE "public"."enum__district_guides_v_version_planning_developments_status" ADD VALUE 'ihale' BEFORE 'uygulama';
  ALTER TYPE "public"."enum__district_guides_v_version_planning_developments_status" ADD VALUE 'insaat' BEFORE 'uygulama';
  ALTER TYPE "public"."enum__district_guides_v_version_planning_developments_status" ADD VALUE 'belirsiz';
  CREATE TABLE "district_guides_reviewed_sections" (
    "order" integer NOT NULL,
    "parent_id" uuid NOT NULL,
    "value" "enum_district_guides_reviewed_sections",
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );

  CREATE TABLE "district_guides_sources_sections" (
    "order" integer NOT NULL,
    "parent_id" varchar NOT NULL,
    "value" "enum_district_guides_sources_sections",
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );

  CREATE TABLE "district_guides_sources" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "publisher" varchar,
    "url" varchar,
    "source_type" "enum_district_guides_sources_source_type" DEFAULT 'unclassified',
    "primary" boolean DEFAULT false,
    "data_date" timestamp(3) with time zone,
    "checked_at" timestamp(3) with time zone,
    "needs_verification" boolean DEFAULT true
  );

  CREATE TABLE "_district_guides_v_version_reviewed_sections" (
    "order" integer NOT NULL,
    "parent_id" uuid NOT NULL,
    "value" "enum__district_guides_v_version_reviewed_sections",
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );

  CREATE TABLE "_district_guides_v_version_sources_sections" (
    "order" integer NOT NULL,
    "parent_id" uuid NOT NULL,
    "value" "enum__district_guides_v_version_sources_sections",
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );

  CREATE TABLE "_district_guides_v_version_sources" (
    "_order" integer NOT NULL,
    "_parent_id" uuid NOT NULL,
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar,
    "publisher" varchar,
    "url" varchar,
    "source_type" "enum__district_guides_v_version_sources_source_type" DEFAULT 'unclassified',
    "primary" boolean DEFAULT false,
    "data_date" timestamp(3) with time zone,
    "checked_at" timestamp(3) with time zone,
    "needs_verification" boolean DEFAULT true,
    "_uuid" varchar
  );

  ALTER TABLE "district_guides_planning_developments" ADD COLUMN "needs_verification" boolean DEFAULT true;
  ALTER TABLE "district_guides" ADD COLUMN "market_data_source_url" varchar;
  ALTER TABLE "district_guides" ADD COLUMN "market_data_checked_at" timestamp(3) with time zone;
  ALTER TABLE "district_guides" ADD COLUMN "market_data_needs_verification" boolean DEFAULT true;
  ALTER TABLE "district_guides" ADD COLUMN "research_notes" varchar;
  ALTER TABLE "district_guides" ADD COLUMN "import_provenance" jsonb;
  ALTER TABLE "district_guides_locales" ADD COLUMN "summary" varchar;
  ALTER TABLE "district_guides_locales" ADD COLUMN "geography" varchar;
  ALTER TABLE "district_guides_locales" ADD COLUMN "places_guide" varchar;
  ALTER TABLE "district_guides_locales" ADD COLUMN "distinctive_features" varchar;
  ALTER TABLE "district_guides_locales" ADD COLUMN "research_topics" varchar;
  ALTER TABLE "_district_guides_v_version_planning_developments" ADD COLUMN "needs_verification" boolean DEFAULT true;
  ALTER TABLE "_district_guides_v" ADD COLUMN "version_market_data_source_url" varchar;
  ALTER TABLE "_district_guides_v" ADD COLUMN "version_market_data_checked_at" timestamp(3) with time zone;
  ALTER TABLE "_district_guides_v" ADD COLUMN "version_market_data_needs_verification" boolean DEFAULT true;
  ALTER TABLE "_district_guides_v" ADD COLUMN "version_research_notes" varchar;
  ALTER TABLE "_district_guides_v" ADD COLUMN "version_import_provenance" jsonb;
  ALTER TABLE "_district_guides_v_locales" ADD COLUMN "version_summary" varchar;
  ALTER TABLE "_district_guides_v_locales" ADD COLUMN "version_geography" varchar;
  ALTER TABLE "_district_guides_v_locales" ADD COLUMN "version_places_guide" varchar;
  ALTER TABLE "_district_guides_v_locales" ADD COLUMN "version_distinctive_features" varchar;
  ALTER TABLE "_district_guides_v_locales" ADD COLUMN "version_research_topics" varchar;
  ALTER TABLE "district_guides_reviewed_sections" ADD CONSTRAINT "district_guides_reviewed_sections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_sources_sections" ADD CONSTRAINT "district_guides_sources_sections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."district_guides_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_sources" ADD CONSTRAINT "district_guides_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_reviewed_sections" ADD CONSTRAINT "_district_guides_v_version_reviewed_sections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_district_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_sources_sections" ADD CONSTRAINT "_district_guides_v_version_sources_sections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_district_guides_v_version_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_sources" ADD CONSTRAINT "_district_guides_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "district_guides_reviewed_sections_order_idx" ON "district_guides_reviewed_sections" USING btree ("order");
  CREATE INDEX "district_guides_reviewed_sections_parent_idx" ON "district_guides_reviewed_sections" USING btree ("parent_id");
  CREATE INDEX "district_guides_sources_sections_order_idx" ON "district_guides_sources_sections" USING btree ("order");
  CREATE INDEX "district_guides_sources_sections_parent_idx" ON "district_guides_sources_sections" USING btree ("parent_id");
  CREATE INDEX "district_guides_sources_order_idx" ON "district_guides_sources" USING btree ("_order");
  CREATE INDEX "district_guides_sources_parent_id_idx" ON "district_guides_sources" USING btree ("_parent_id");
  CREATE INDEX "_district_guides_v_version_reviewed_sections_order_idx" ON "_district_guides_v_version_reviewed_sections" USING btree ("order");
  CREATE INDEX "_district_guides_v_version_reviewed_sections_parent_idx" ON "_district_guides_v_version_reviewed_sections" USING btree ("parent_id");
  CREATE INDEX "_district_guides_v_version_sources_sections_order_idx" ON "_district_guides_v_version_sources_sections" USING btree ("order");
  CREATE INDEX "_district_guides_v_version_sources_sections_parent_idx" ON "_district_guides_v_version_sources_sections" USING btree ("parent_id");
  CREATE INDEX "_district_guides_v_version_sources_order_idx" ON "_district_guides_v_version_sources" USING btree ("_order");
  CREATE INDEX "_district_guides_v_version_sources_parent_id_idx" ON "_district_guides_v_version_sources" USING btree ("_parent_id");`)
}

export async function down(): Promise<void> {
  throw new Error('Automatic rollback is disabled to preserve district sources and research. Keep this additive schema when rolling application code back.');
}
