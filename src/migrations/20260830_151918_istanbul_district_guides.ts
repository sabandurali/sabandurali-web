import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_district_guides_planning_developments_status" AS ENUM('teklif', 'planlama', 'belediye-meclisi-karari', 'onay', 'aski', 'uygulama', 'tamamlandi');
  CREATE TYPE "public"."enum_district_guides_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum_district_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__district_guides_v_version_planning_developments_status" AS ENUM('teklif', 'planlama', 'belediye-meclisi-karari', 'onay', 'aski', 'uygulama', 'tamamlandi');
  CREATE TYPE "public"."enum__district_guides_v_version_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum__district_guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__district_guides_v_published_locale" AS ENUM('tr', 'en');
  CREATE TYPE "public"."enum_articles_article_type" AS ENUM('article', 'district-research', 'district-news');
  CREATE TYPE "public"."enum_articles_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum_articles_news_category" AS ENUM('ulasim', 'sehircilik', 'belediye', 'kultur', 'yasam', 'gayrimenkul', 'egitim', 'cevre', 'onemli-yerel-gelismeler');
  CREATE TYPE "public"."enum__articles_v_version_article_type" AS ENUM('article', 'district-research', 'district-news');
  CREATE TYPE "public"."enum__articles_v_version_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum__articles_v_version_news_category" AS ENUM('ulasim', 'sehircilik', 'belediye', 'kultur', 'yasam', 'gayrimenkul', 'egitim', 'cevre', 'onemli-yerel-gelismeler');
  CREATE TYPE "public"."enum_photos_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum_photos_district_photo_category" AS ENUM('mimari', 'sokak', 'tarih', 'yasam', 'ulasim', 'doga', 'gece');
  CREATE TYPE "public"."enum_photos_day_period" AS ENUM('gunduz', 'gece');
  CREATE TYPE "public"."enum__photos_v_version_district" AS ENUM('arnavutkoy', 'avcilar', 'bagcilar', 'bahcelievler', 'bakirkoy', 'basaksehir', 'bayrampasa', 'besiktas', 'beylikduzu', 'beyoglu', 'buyukcekmece', 'catalca', 'esenler', 'esenyurt', 'eyupsultan', 'fatih', 'gaziosmanpasa', 'gungoren', 'kagithane', 'kucukcekmece', 'sariyer', 'silivri', 'sultangazi', 'sisli', 'zeytinburnu', 'adalar', 'atasehir', 'beykoz', 'cekmekoy', 'kadikoy', 'kartal', 'maltepe', 'pendik', 'sancaktepe', 'sultanbeyli', 'sile', 'tuzla', 'umraniye', 'uskudar');
  CREATE TYPE "public"."enum__photos_v_version_district_photo_category" AS ENUM('mimari', 'sokak', 'tarih', 'yasam', 'ulasim', 'doga', 'gece');
  CREATE TYPE "public"."enum__photos_v_version_day_period" AS ENUM('gunduz', 'gece');
  CREATE TABLE "district_guides_neighborhoods" (
	"_order" integer NOT NULL,
	"_parent_id" uuid NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar,
	"featured" boolean DEFAULT false,
	"image_id" uuid
  );

  CREATE TABLE "district_guides_neighborhoods_locales" (
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "district_guides_planning_developments" (
	"_order" integer NOT NULL,
	"_parent_id" uuid NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"neighborhood" varchar,
	"date" timestamp(3) with time zone,
	"status" "enum_district_guides_planning_developments_status",
	"official_source" varchar,
	"checked_at" timestamp(3) with time zone
  );

  CREATE TABLE "district_guides_planning_developments_locales" (
	"title" varchar,
	"summary" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "district_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"district" "enum_district_guides_district",
	"facts_population" varchar,
	"facts_population_year" numeric,
	"facts_area_km2" numeric,
	"facts_neighborhood_count" numeric,
	"facts_neighboring_districts" varchar,
	"market_data_sale_price_per_m2" numeric,
	"market_data_average_rent" numeric,
	"market_data_data_date" timestamp(3) with time zone,
	"market_data_source" varchar,
	"published_at" timestamp(3) with time zone,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_district_guides_status" DEFAULT 'draft'
  );

  CREATE TABLE "district_guides_locales" (
	"history" varchar,
	"life" varchar,
	"transportation" varchar,
	"facts_location_summary" varchar,
	"housing_texture" varchar,
	"regional_assessment" varchar,
	"market_data_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" uuid NOT NULL
  );

  CREATE TABLE "_district_guides_v_version_neighborhoods" (
	"_order" integer NOT NULL,
	"_parent_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar,
	"featured" boolean DEFAULT false,
	"image_id" uuid,
	"_uuid" varchar
  );

  CREATE TABLE "_district_guides_v_version_neighborhoods_locales" (
	"description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" uuid NOT NULL
  );

  CREATE TABLE "_district_guides_v_version_planning_developments" (
	"_order" integer NOT NULL,
	"_parent_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"neighborhood" varchar,
	"date" timestamp(3) with time zone,
	"status" "enum__district_guides_v_version_planning_developments_status",
	"official_source" varchar,
	"checked_at" timestamp(3) with time zone,
	"_uuid" varchar
  );

  CREATE TABLE "_district_guides_v_version_planning_developments_locales" (
	"title" varchar,
	"summary" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" uuid NOT NULL
  );

  CREATE TABLE "_district_guides_v" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"version_district" "enum__district_guides_v_version_district",
	"version_facts_population" varchar,
	"version_facts_population_year" numeric,
	"version_facts_area_km2" numeric,
	"version_facts_neighborhood_count" numeric,
	"version_facts_neighboring_districts" varchar,
	"version_market_data_sale_price_per_m2" numeric,
	"version_market_data_average_rent" numeric,
	"version_market_data_data_date" timestamp(3) with time zone,
	"version_market_data_source" varchar,
	"version_published_at" timestamp(3) with time zone,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__district_guides_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"snapshot" boolean,
	"published_locale" "enum__district_guides_v_published_locale",
	"latest" boolean
  );

  CREATE TABLE "_district_guides_v_locales" (
	"version_history" varchar,
	"version_life" varchar,
	"version_transportation" varchar,
	"version_facts_location_summary" varchar,
	"version_housing_texture" varchar,
	"version_regional_assessment" varchar,
	"version_market_data_description" varchar,
	"id" serial PRIMARY KEY NOT NULL,
	"_locale" "_locales" NOT NULL,
	"_parent_id" uuid NOT NULL
  );

  ALTER TABLE "articles" ADD COLUMN "article_type" "enum_articles_article_type" DEFAULT 'article';
  ALTER TABLE "articles" ADD COLUMN "district" "enum_articles_district";
  ALTER TABLE "articles" ADD COLUMN "district_neighborhood" varchar;
  ALTER TABLE "articles" ADD COLUMN "news_category" "enum_articles_news_category";
  ALTER TABLE "articles" ADD COLUMN "external_source_name" varchar;
  ALTER TABLE "articles" ADD COLUMN "external_source_url" varchar;
  ALTER TABLE "articles" ADD COLUMN "external_source_checked_at" timestamp(3) with time zone;
  ALTER TABLE "_articles_v" ADD COLUMN "version_article_type" "enum__articles_v_version_article_type" DEFAULT 'article';
  ALTER TABLE "_articles_v" ADD COLUMN "version_district" "enum__articles_v_version_district";
  ALTER TABLE "_articles_v" ADD COLUMN "version_district_neighborhood" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_news_category" "enum__articles_v_version_news_category";
  ALTER TABLE "_articles_v" ADD COLUMN "version_external_source_name" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_external_source_url" varchar;
  ALTER TABLE "_articles_v" ADD COLUMN "version_external_source_checked_at" timestamp(3) with time zone;
  ALTER TABLE "photos" ADD COLUMN "district" "enum_photos_district";
  ALTER TABLE "photos" ADD COLUMN "district_photo_category" "enum_photos_district_photo_category";
  ALTER TABLE "photos" ADD COLUMN "day_period" "enum_photos_day_period";
  ALTER TABLE "photos_locales" ADD COLUMN "neighborhood" varchar;
  ALTER TABLE "_photos_v" ADD COLUMN "version_district" "enum__photos_v_version_district";
  ALTER TABLE "_photos_v" ADD COLUMN "version_district_photo_category" "enum__photos_v_version_district_photo_category";
  ALTER TABLE "_photos_v" ADD COLUMN "version_day_period" "enum__photos_v_version_day_period";
  ALTER TABLE "_photos_v_locales" ADD COLUMN "version_neighborhood" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "district_guides_id" uuid;
  ALTER TABLE "district_guides_neighborhoods" ADD CONSTRAINT "district_guides_neighborhoods_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "district_guides_neighborhoods" ADD CONSTRAINT "district_guides_neighborhoods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_neighborhoods_locales" ADD CONSTRAINT "district_guides_neighborhoods_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides_neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_planning_developments" ADD CONSTRAINT "district_guides_planning_developments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_planning_developments_locales" ADD CONSTRAINT "district_guides_planning_developments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides_planning_developments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "district_guides_locales" ADD CONSTRAINT "district_guides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_neighborhoods" ADD CONSTRAINT "_district_guides_v_version_neighborhoods_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_neighborhoods" ADD CONSTRAINT "_district_guides_v_version_neighborhoods_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_neighborhoods_locales" ADD CONSTRAINT "_district_guides_v_version_neighborhoods_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v_version_neighborhoods"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_planning_developments" ADD CONSTRAINT "_district_guides_v_version_planning_developments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v_version_planning_developments_locales" ADD CONSTRAINT "_district_guides_v_version_planning_developments_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v_version_planning_developments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_district_guides_v" ADD CONSTRAINT "_district_guides_v_parent_id_district_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."district_guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_district_guides_v_locales" ADD CONSTRAINT "_district_guides_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_district_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "district_guides_neighborhoods_order_idx" ON "district_guides_neighborhoods" USING btree ("_order");
  CREATE INDEX "district_guides_neighborhoods_parent_id_idx" ON "district_guides_neighborhoods" USING btree ("_parent_id");
  CREATE INDEX "district_guides_neighborhoods_image_idx" ON "district_guides_neighborhoods" USING btree ("image_id");
  CREATE UNIQUE INDEX "district_guides_neighborhoods_locales_locale_parent_id_uniqu" ON "district_guides_neighborhoods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "district_guides_planning_developments_order_idx" ON "district_guides_planning_developments" USING btree ("_order");
  CREATE INDEX "district_guides_planning_developments_parent_id_idx" ON "district_guides_planning_developments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "district_guides_planning_developments_locales_locale_parent_" ON "district_guides_planning_developments_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "district_guides_district_idx" ON "district_guides" USING btree ("district");
  CREATE INDEX "district_guides_updated_at_idx" ON "district_guides" USING btree ("updated_at");
  CREATE INDEX "district_guides_created_at_idx" ON "district_guides" USING btree ("created_at");
  CREATE INDEX "district_guides__status_idx" ON "district_guides" USING btree ("_status");
  CREATE UNIQUE INDEX "district_guides_locales_locale_parent_id_unique" ON "district_guides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_district_guides_v_version_neighborhoods_order_idx" ON "_district_guides_v_version_neighborhoods" USING btree ("_order");
  CREATE INDEX "_district_guides_v_version_neighborhoods_parent_id_idx" ON "_district_guides_v_version_neighborhoods" USING btree ("_parent_id");
  CREATE INDEX "_district_guides_v_version_neighborhoods_image_idx" ON "_district_guides_v_version_neighborhoods" USING btree ("image_id");
  CREATE UNIQUE INDEX "_district_guides_v_version_neighborhoods_locales_locale_pare" ON "_district_guides_v_version_neighborhoods_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_district_guides_v_version_planning_developments_order_idx" ON "_district_guides_v_version_planning_developments" USING btree ("_order");
  CREATE INDEX "_district_guides_v_version_planning_developments_parent_id_idx" ON "_district_guides_v_version_planning_developments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_district_guides_v_version_planning_developments_locales_loc" ON "_district_guides_v_version_planning_developments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_district_guides_v_parent_idx" ON "_district_guides_v" USING btree ("parent_id");
  CREATE INDEX "_district_guides_v_version_version_district_idx" ON "_district_guides_v" USING btree ("version_district");
  CREATE INDEX "_district_guides_v_version_version_updated_at_idx" ON "_district_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_district_guides_v_version_version_created_at_idx" ON "_district_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_district_guides_v_version_version__status_idx" ON "_district_guides_v" USING btree ("version__status");
  CREATE INDEX "_district_guides_v_created_at_idx" ON "_district_guides_v" USING btree ("created_at");
  CREATE INDEX "_district_guides_v_updated_at_idx" ON "_district_guides_v" USING btree ("updated_at");
  CREATE INDEX "_district_guides_v_snapshot_idx" ON "_district_guides_v" USING btree ("snapshot");
  CREATE INDEX "_district_guides_v_published_locale_idx" ON "_district_guides_v" USING btree ("published_locale");
  CREATE INDEX "_district_guides_v_latest_idx" ON "_district_guides_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_district_guides_v_locales_locale_parent_id_unique" ON "_district_guides_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_district_guides_fk" FOREIGN KEY ("district_guides_id") REFERENCES "public"."district_guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_district_idx" ON "articles" USING btree ("district");
  CREATE INDEX "_articles_v_version_version_district_idx" ON "_articles_v" USING btree ("version_district");
  CREATE INDEX "photos_district_idx" ON "photos" USING btree ("district");
  CREATE INDEX "_photos_v_version_version_district_idx" ON "_photos_v" USING btree ("version_district");
  CREATE INDEX "payload_locked_documents_rels_district_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("district_guides_id");`)
}

export async function down(): Promise<void> {
  // Removing these additive tables/columns would discard district content.
  // Fail before SQL or migration-history removal; roll application code back
  // while keeping the compatible schema. Any schema removal needs a separately
  // reviewed, backed-up data migration.
  throw new Error(
    'Automatic rollback is disabled to preserve district guide, article, and photo data. Keep the additive schema when rolling back application code.',
  )
}
